import { AIProxy } from './ai-proxy';
import { MessageType } from '../shared/types';
import { createMessage } from '../shared/messages';

/**
 * SSE 流式转发：将 AI 流式输出通过 chrome.runtime.Port 或回调转发
 */
export class SSERelay {
  private activeStreams = new Map<string, AbortController>();

  /**
   * 启动 SSE 流式转发
   * @param endpoint 本地服务 API 端点
   * @param payload 请求参数
   * @param chunkMessageType 流式 chunk 的消息类型
   * @param doneMessageType 完成时的消息类型
   * @param sendChunk 发送 chunk 的回调
   */
  async startRelay(
    endpoint: string,
    payload: any,
    chunkMessageType: MessageType,
    doneMessageType: MessageType,
    sendChunk: (msg: any) => void
  ): Promise<void> {
    const aiProxy = new AIProxy();
    const streamId = payload?.requestId || crypto.randomUUID();
    const abortController = new AbortController();
    this.activeStreams.set(streamId, abortController);

    try {
      // 将 AbortController.signal 传递给 requestSSE，使 fetch 请求可被中断
      for await (const chunk of aiProxy.requestSSE(
        endpoint,
        payload,
        abortController.signal
      )) {
        // 检查是否已取消
        if (abortController.signal.aborted) {
          break;
        }

        if (chunk.done) {
          sendChunk(
            createMessage(doneMessageType, 'background', {
              chunk: chunk.chunk,
              done: true,
            })
          );
          break;
        }

        if (chunk.error) {
          sendChunk(
            createMessage(MessageType.ERROR, 'background', {
              error: chunk.error,
            })
          );
          break;
        }

        sendChunk(
          createMessage(chunkMessageType, 'background', {
            chunk: chunk.chunk,
            done: false,
          })
        );
      }
    } catch (error) {
      // 如果是 abort 导致的中断，不发送错误消息
      if ((error as Error).name === 'AbortError') {
        sendChunk(
          createMessage(doneMessageType, 'background', {
            chunk: '',
            done: true,
            cancelled: true,
          })
        );
      } else {
        sendChunk(
          createMessage(MessageType.ERROR, 'background', {
            error: (error as Error).message,
          })
        );
      }
    } finally {
      this.activeStreams.delete(streamId);
    }
  }

  /**
   * 取消指定的流式传输
   */
  cancelStream(streamId: string): void {
    const controller = this.activeStreams.get(streamId);
    if (controller) {
      controller.abort();
      this.activeStreams.delete(streamId);
    }
  }

  /**
   * 取消所有流式传输
   */
  cancelAll(): void {
    for (const [_id, controller] of this.activeStreams) {
      controller.abort();
    }
    this.activeStreams.clear();
  }

  /**
   * 获取当前活跃流数量
   */
  getActiveStreamCount(): number {
    return this.activeStreams.size;
  }
}
