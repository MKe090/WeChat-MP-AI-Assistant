import { LOCAL_SERVER_URL } from '../shared/constants';
import { SSEChunk } from '../shared/types';

/**
 * AI 请求代理：向本地服务发 HTTP / SSE 请求
 */
export class AIProxy {
  private baseUrl: string = LOCAL_SERVER_URL;

  /**
   * 发送普通 HTTP 请求
   */
  async request(endpoint: string, payload: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `AI proxy request failed: ${response.status} ${errorText}`
      );
    }

    return response.json();
  }

  async get(endpoint: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `AI proxy GET failed: ${response.status} ${errorText}`
      );
    }

    return response.json();
  }

  /**
   * 发送 SSE 流式请求，返回 AsyncGenerator
   * @param endpoint API 端点
   * @param payload 请求参数
   * @param signal 可选的 AbortSignal，用于中断请求
   */
  async *requestSSE(
    endpoint: string,
    payload: any,
    signal?: AbortSignal
  ): AsyncGenerator<SSEChunk> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal, // 传递 AbortSignal 以支持中断
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `SSE request failed: ${response.status} ${errorText}`
      );
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        // 在读取前检查是否已中断
        if (signal?.aborted) {
          reader.cancel();
          break;
        }

        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const jsonStr = trimmed.slice(6);
            try {
              const data = JSON.parse(jsonStr) as SSEChunk;
              yield data;
              if (data.done) return;
            } catch {
              // 跳过无效 JSON 行
              console.warn('[WAA] Invalid SSE data line:', jsonStr);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`, {
        method: 'GET',
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
