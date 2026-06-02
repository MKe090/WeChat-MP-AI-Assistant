import { useState, useCallback, useRef } from 'react';
import { SSEChunk } from '../../shared/types';

/**
 * SSE 流式数据 Hook
 */
export function useSSEStream() {
  const [content, setContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  /**
   * 启动 SSE 流式请求
   */
  const startStream = useCallback(
    async (url: string, payload: any): Promise<void> => {
      setContent('');
      setError(null);
      setIsStreaming(true);
      const abortController = new AbortController();
      abortRef.current = abortController;

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              try {
                const data: SSEChunk = JSON.parse(trimmed.slice(6));
                if (data.error) {
                  setError(data.error);
                  break;
                }
                if (data.chunk) {
                  setContent((prev) => prev + data.chunk);
                }
                if (data.done) {
                  setIsStreaming(false);
                  return;
                }
              } catch {
                // 跳过无效 JSON
              }
            }
          }
        }
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          setError(e.message);
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    []
  );

  /**
   * 停止 SSE 流式请求
   */
  const stopStream = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }, []);

  /**
   * 重置状态
   */
  const reset = useCallback(() => {
    setContent('');
    setError(null);
    setIsStreaming(false);
  }, []);

  return {
    content,
    isStreaming,
    error,
    startStream,
    stopStream,
    reset,
  };
}
