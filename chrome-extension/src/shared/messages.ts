import { MessageType, MessageSource, ExtMessage } from './types';

/**
 * 创建扩展内部消息
 */
export function createMessage(
  type: MessageType,
  source: MessageSource,
  payload?: any
): ExtMessage {
  return {
    type,
    source,
    payload,
    requestId: crypto.randomUUID(),
    timestamp: Date.now(),
  };
}

/**
 * 发送消息到 Background Service Worker
 */
export function sendMessage(message: ExtMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

/**
 * 向指定 Tab 的 Content Script 发送消息
 */
export function sendTabMessage(
  tabId: number,
  message: ExtMessage
): Promise<any> {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}
