import { PluginHost } from './plugin-host';
import { Injector } from './injector';
import { EditorObserver } from './editor-observer';
import { EditorAdapter } from './editor-adapter';
import { MessageType, ExtMessage } from '../shared/types';
import { mountSidePanel } from '../side-panel';

// 等待页面加载完成
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function init() {
  console.info('[WAA] Content script initializing...');

  const editorAdapter = new EditorAdapter();
  const editorObserver = new EditorObserver();
  const injector = new Injector();
  const pluginHost = new PluginHost(editorAdapter, editorObserver);

  // 注入 UI 组件
  injector.injectSidePanel();
  injector.injectToolbar();

  // 将侧边面板 React 应用挂载到 Shadow DOM
  const sidePanelContainer = injector.getSidePanelContainer();
  const emotionStyleContainer = injector.getEmotionStyleContainer();
  if (sidePanelContainer && emotionStyleContainer) {
    mountSidePanel(sidePanelContainer, emotionStyleContainer);
  }

  // 初始化插件系统
  pluginHost.initialize();

  // 启动编辑器监听
  editorObserver.startWatch();

  // 监听来自 Background 的消息
  chrome.runtime.onMessage.addListener(
    (message: ExtMessage, _sender, sendResponse) => {
      try {
        const result = handleEditorMessage(message, editorAdapter);
        sendResponse({ code: 0, data: result, message: 'ok' });
      } catch (error) {
        sendResponse({
          code: 1,
          data: null,
          message: (error as Error).message,
        });
      }
      return false; // 同步响应
    }
  );

  // 建立长连接（用于 SSE 流式传输）
  const port = chrome.runtime.connect({ name: 'waa-content' });
  port.onMessage.addListener((message: ExtMessage) => {
    pluginHost.handleMessage(message);
  });

  console.info('[WAA] Content script initialized');
}

/**
 * 处理编辑器相关的消息
 */
function handleEditorMessage(
  message: ExtMessage,
  editorAdapter: EditorAdapter
): any {
  switch (message.type) {
    case MessageType.EDITOR_GET_CONTENT:
      return editorAdapter.getContent();

    case MessageType.EDITOR_SET_CONTENT:
      editorAdapter.setContent(message.payload?.html || '');
      return { success: true };

    case MessageType.EDITOR_GET_TITLE:
      return editorAdapter.getTitle();

    case MessageType.EDITOR_SET_TITLE:
      editorAdapter.setTitle(message.payload?.title || '');
      return { success: true };

    case MessageType.EDITOR_INSERT:
      editorAdapter.insertAtCursor(message.payload?.html || '');
      return { success: true };

    default:
      return null;
  }
}
