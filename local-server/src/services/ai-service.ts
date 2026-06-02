import { OpenAIProvider, AIProvider, DynamicOpenAIConfig } from './openai-provider.js';
import { OllamaProvider } from './ollama-provider.js';
import { MockProvider } from './mock-provider.js';
import { config } from '../config.js';
import { writingPrompt } from '../prompts/writing.prompt.js';
import { titleOptimizePrompt } from '../prompts/title-optimize.prompt.js';
import { formattingPrompt } from '../prompts/formatting.prompt.js';
import { diagnosisPrompt } from '../prompts/diagnosis.prompt.js';
import { violationCheckPrompt } from '../prompts/violation-check.prompt.js';

export interface SSEChunk {
  chunk: string;
  done: boolean;
  error?: string;
}

export interface TitleAnalysis {
  score: number;
  originalTitle: string;
  suggestedTitles: SuggestedTitle[];
  analysis: string;
}

export interface SuggestedTitle {
  title: string;
  reason: string;
}

export interface ViolationResult {
  hasViolation: boolean;
  items: ViolationItem[];
  riskLevel: 'low' | 'medium' | 'high';
  suggestions: string[];
}

export interface ViolationItem {
  text: string;
  type: string;
  position: number;
  reason: string;
}

export type WritingMode = 'long' | 'short';
export type AIModeType = 'openai' | 'ollama' | 'custom' | 'mock';

export class AIService {
  private currentMode: AIModeType = config.aiMode as AIModeType;
  private openaiProvider: OpenAIProvider;
  private ollamaProvider: OllamaProvider;
  private mockProvider: MockProvider;
  private customProvider: OpenAIProvider | null = null;

  constructor() {
    this.openaiProvider = new OpenAIProvider();
    this.ollamaProvider = new OllamaProvider();
    this.mockProvider = new MockProvider();
    if (!['openai', 'ollama', 'custom', 'mock'].includes(this.currentMode)) {
      this.currentMode = 'openai';
    }
  }

  get provider(): AIProvider {
    switch (this.currentMode) {
      case 'custom':
        return this.customProvider || this.openaiProvider;
      case 'ollama':
        return this.ollamaProvider;
      case 'mock':
        return this.mockProvider;
      case 'openai':
      default:
        return this.openaiProvider;
    }
  }

  switchProvider(mode: AIModeType, customConfig?: DynamicOpenAIConfig): void {
    this.currentMode = mode;
    if (mode === 'custom' && customConfig) {
      this.customProvider = new OpenAIProvider(customConfig);
    }
  }

  getCurrentMode(): string {
    return this.currentMode;
  }

  async *writing(params: {
    topic: string;
    mode?: WritingMode;
    style?: string;
    length?: string;
    writingTypePrompt?: string;
  }): AsyncGenerator<SSEChunk> {
    const systemPrompt = writingPrompt(
      params.mode || 'long',
      params.style,
      params.length
    );

    for await (const chunk of this.provider.chat({
      systemPrompt,
      userMessage: `${params.writingTypePrompt || '请根据以下主题写一篇文章：'}${params.topic}`,
    })) {
      yield { chunk, done: false };
    }
    yield { chunk: '', done: true };
  }

  async titleOptimize(title: string, content?: string): Promise<TitleAnalysis> {
    const result = await this.provider.complete({
      systemPrompt: titleOptimizePrompt(),
      userMessage: content
        ? `文章标题：${title}\n文章摘要：${content.substring(0, 500)}`
        : `文章标题：${title}`,
    });

    try {
      return JSON.parse(stripJsonFence(result)) as TitleAnalysis;
    } catch {
      return {
        score: 5,
        originalTitle: title,
        suggestedTitles: [],
        analysis: result,
      };
    }
  }

  async formatting(
    html: string,
    styleName: string
  ): Promise<{ formattedHtml: string }> {
    const result = await this.provider.complete({
      systemPrompt: formattingPrompt(styleName),
      userMessage: html,
    });
    return { formattedHtml: result };
  }

  async formattingPreview(
    html: string,
    styleName: string
  ): Promise<{ previewHtml: string; formattedHtml: string }> {
    const result = await this.formatting(html, styleName);
    return { previewHtml: result.formattedHtml, formattedHtml: result.formattedHtml };
  }

  async *diagnosis(articles: any): AsyncGenerator<SSEChunk> {
    const systemPrompt = diagnosisPrompt();
    const userMessage = `以下是近期文章数据：\n${JSON.stringify(articles, null, 2)}`;

    for await (const chunk of this.provider.chat({ systemPrompt, userMessage })) {
      yield { chunk, done: false };
    }
    yield { chunk: '', done: true };
  }

  async violationCheck(content: string): Promise<ViolationResult> {
    const result = await this.provider.complete({
      systemPrompt: violationCheckPrompt(),
      userMessage: content,
    });

    try {
      return JSON.parse(stripJsonFence(result)) as ViolationResult;
    } catch {
      return {
        hasViolation: false,
        items: [],
        riskLevel: 'low',
        suggestions: [result],
      };
    }
  }
}

function stripJsonFence(text: string): string {
  return text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '');
}
