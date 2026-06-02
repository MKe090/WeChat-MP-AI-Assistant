import OpenAI from 'openai';
import { config } from '../config.js';

/** 聊天参数 */
export interface ChatParams {
  systemPrompt: string;
  userMessage: string;
}

/** 动态 OpenAI 配置（用于自定义 API 模式） */
export interface DynamicOpenAIConfig {
  apiKey: string;
  baseURL: string;
  model: string;
}

/** AI 提供者接口 */
export interface AIProvider {
  chat(params: ChatParams): AsyncGenerator<string>;
  complete(params: ChatParams): Promise<string>;
}

/**
 * OpenAI 提供者
 * 支持默认配置（环境变量）和动态配置（请求时传入）
 */
export class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  private model: string;

  constructor(dynamicConfig?: DynamicOpenAIConfig) {
    if (dynamicConfig) {
      this.client = new OpenAI({
        apiKey: dynamicConfig.apiKey,
        baseURL: normalizeBaseUrl(dynamicConfig.baseURL),
      });
      this.model = dynamicConfig.model;
    } else {
      this.client = new OpenAI({
        apiKey: config.openaiApiKey,
        baseURL: normalizeBaseUrl(config.openaiBaseUrl),
      });
      this.model = config.openaiModel;
    }
  }

  /**
   * 流式聊天
   */
  async *chat(params: ChatParams): AsyncGenerator<string> {
    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: params.systemPrompt },
        { role: 'user', content: params.userMessage },
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) yield content;
    }
  }

  /**
   * 完整响应
   */
  async complete(params: ChatParams): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: params.systemPrompt },
        { role: 'user', content: params.userMessage },
      ],
    });
    return response.choices[0]?.message?.content || '';
  }
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/chat\/completions\/?$/, '').replace(/\/$/, '');
}
