import { useCallback } from 'react';
import { ExtMessage, MessageType, MessageSource } from '../../shared/types';
import { createMessage, sendMessage } from '../../shared/messages';

/**
 * Chrome 消息通信 Hook
 */
export function useMessage() {
  /**
   * 发送消息到 Background Service Worker
   */
  const sendToBackground = useCallback(
    async (type: MessageType, payload?: any): Promise<any> => {
      const msg = createMessage(type, 'side-panel' as MessageSource, payload);
      return sendMessage(msg);
    },
    []
  );

  /**
   * 发送消息到 Content Script（通过 Background 转发）
   */
  const sendToContentScript = useCallback(
    async (type: MessageType, payload?: any): Promise<any> => {
      // Content Script 消息通过 Background 转发
      const msg = createMessage(type, 'side-panel' as MessageSource, payload);
      return sendMessage(msg);
    },
    []
  );

  /**
   * 监听来自 Background 的消息
   */
  const onMessage = useCallback(
    (handler: (message: ExtMessage) => void) => {
      const listener = (
        message: ExtMessage,
        _sender: chrome.runtime.MessageSender
      ) => {
        handler(message);
      };

      chrome.runtime.onMessage.addListener(listener);
      return () => {
        chrome.runtime.onMessage.removeListener(listener);
      };
    },
    []
  );

  return { sendToBackground, sendToContentScript, onMessage };
}
