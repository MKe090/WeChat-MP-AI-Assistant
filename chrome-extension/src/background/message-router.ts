import { ExtMessage, MessageType } from '../shared/types';

type MessageHandler = (
  message: ExtMessage,
  sender: chrome.runtime.MessageSender
) => Promise<any>;

/**
 * 消息路由器：按 MessageType 分发消息到对应处理器
 */
export class MessageRouter {
  private handlers = new Map<MessageType, MessageHandler>();

  /**
   * 注册消息处理器
   */
  register(type: MessageType, handler: MessageHandler): void {
    this.handlers.set(type, handler);
  }

  /**
   * 注销消息处理器
   */
  unregister(type: MessageType): void {
    this.handlers.delete(type);
  }

  /**
   * 路由消息到对应处理器
   */
  async route(
    message: ExtMessage,
    sender: chrome.runtime.MessageSender
  ): Promise<any> {
    const handler = this.handlers.get(message.type);
    if (!handler) {
      console.warn(
        `[WAA] No handler for message type: ${message.type}`
      );
      return { code: 1, message: 'Unknown message type', data: null };
    }
    try {
      return await handler(message, sender);
    } catch (error) {
      console.error(
        `[WAA] Handler error for ${message.type}:`,
        error
      );
      throw error;
    }
  }

  /**
   * 获取已注册的消息类型列表
   */
  getRegisteredTypes(): MessageType[] {
    return Array.from(this.handlers.keys());
  }
}
