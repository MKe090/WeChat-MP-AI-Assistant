import { config } from '../config.js';
import { ChatParams, AIProvider } from './openai-provider.js';

/**
 * Ollama 提供者
 */
export class OllamaProvider implements AIProvider {
  private baseUrl: string;
  private model: string;

  constructor() {
    this.baseUrl = config.ollamaBaseUrl;
    this.model = config.ollamaModel;
  }

  /**
   * 流式聊天
   */
  async *chat(params: ChatParams): AsyncGenerator<string> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: params.systemPrompt },
          { role: 'user', content: params.userMessage },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Ollama request failed: ${response.status} ${response.statusText}`
      );
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value, { stream: true });
      for (const line of text.split('\n')) {
        if (line.trim()) {
          try {
            const data = JSON.parse(line);
            if (data.message?.content) yield data.message.content;
            if (data.done) return;
          } catch {
            // 跳过无效 JSON 行
          }
        }
      }
    }
  }

  /**
   * 完整响应
   */
  async complete(params: ChatParams): Promise<string> {
    let result = '';
    for await (const chunk of this.chat(params)) {
      result += chunk;
    }
    return result;
  }
}
