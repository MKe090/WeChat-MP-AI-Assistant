import { MessageRouter } from './message-router';
import { AIProxy } from './ai-proxy';
import { SSERelay } from './sse-relay';
import { StorageManager } from './storage-manager';
import { PortManager } from './port-manager';
import { MessageType, ExtMessage } from '../shared/types';
import { sendTabMessage } from '../shared/messages';

const router = new MessageRouter();
const aiProxy = new AIProxy();
const sseRelay = new SSERelay();
const storage = new StorageManager();
const portManager = new PortManager();

// ─── 注册消息处理器 ──────────────────────────────────────────

// PING / PONG
router.register(MessageType.PING, async () => {
  return { type: MessageType.PONG, timestamp: Date.now() };
});

// 健康检查（通过 Background 代理，避免 content script 的 CORS 问题）
router.register(MessageType.SERVER_HEALTH_CHECK, async () => {
  const ok = await aiProxy.healthCheck();
  return { code: 0, data: { connected: ok }, message: ok ? 'ok' : 'unreachable' };
});

router.register(MessageType.WECHAT_AUTH_START, async () => {
  return aiProxy.get('/api/wechat/auth/start');
});

router.register(MessageType.WECHAT_AUTH_OPEN, async () => {
  const result = await aiProxy.get('/api/wechat/auth/start');
  const authUrl = result?.data?.authUrl;
  if (!authUrl) {
    return { code: 1, data: null, message: 'No authUrl returned' };
  }
  await chrome.tabs.create({ url: authUrl, active: true });
  return result;
});

router.register(MessageType.WECHAT_AUTH_LIST, async () => {
  return aiProxy.get('/api/wechat/authorizations');
});

// AI 写作（SSE 流式）
router.register(MessageType.AI_WRITING_START, async (msg) => {
  return aiProxy.request('/api/ai/writing', msg.payload);
});

// 标题优化
router.register(MessageType.AI_TITLE_OPTIMIZE, async (msg) => {
  return aiProxy.request('/api/ai/title-optimize', msg.payload);
});

// AI 排版
router.register(MessageType.AI_FORMATTING, async (msg) => {
  return aiProxy.request('/api/ai/formatting', msg.payload);
});

// 排版预览
router.register(MessageType.AI_FORMATTING_PREVIEW, async (msg) => {
  return aiProxy.request('/api/ai/formatting-preview', msg.payload);
});

// 内容诊断（SSE 流式）
router.register(MessageType.AI_DIAGNOSIS_START, async (msg) => {
  return aiProxy.request('/api/ai/diagnosis', msg.payload);
});

// 违规检测
router.register(MessageType.AI_VIOLATION_CHECK, async (msg) => {
  return aiProxy.request('/api/ai/violation-check', msg.payload);
});

// AI 配置更新 — 通知本地服务切换 AI 模式
router.register(MessageType.AI_CONFIG_UPDATE, async (msg) => {
  const { mode } = msg.payload || {};
  if (mode) {
    try {
      await aiProxy.request('/api/config/ai-mode', msg.payload);
      return { code: 0, data: { success: true }, message: 'ok' };
    } catch (error) {
      console.warn('[WAA] Failed to sync AI mode to local server:', error);
      return { code: 0, data: { success: false }, message: 'sync failed' };
    }
  }
  return { code: 0, data: { success: false }, message: 'no mode specified' };
});

// 获取编辑器内容 — 转发给 Content Script
router.register(MessageType.EDITOR_GET_CONTENT, async (msg) => {
  const tabs = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  if (tabs[0]?.id) {
    return sendTabMessage(tabs[0].id, msg);
  }
  throw new Error('No active tab');
});

// 设置编辑器内容 — 转发给 Content Script
router.register(MessageType.EDITOR_SET_CONTENT, async (msg) => {
  const tabs = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  if (tabs[0]?.id) {
    return sendTabMessage(tabs[0].id, msg);
  }
  throw new Error('No active tab');
});

// 获取编辑器标题 — 转发给 Content Script
router.register(MessageType.EDITOR_GET_TITLE, async (msg) => {
  const tabs = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  if (tabs[0]?.id) {
    return sendTabMessage(tabs[0].id, msg);
  }
  throw new Error('No active tab');
});

// 设置编辑器标题 — 转发给 Content Script
router.register(MessageType.EDITOR_SET_TITLE, async (msg) => {
  const tabs = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  if (tabs[0]?.id) {
    return sendTabMessage(tabs[0].id, msg);
  }
  throw new Error('No active tab');
});

// 插入内容到光标位置 — 转发给 Content Script
router.register(MessageType.EDITOR_INSERT, async (msg) => {
  const tabs = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  if (tabs[0]?.id) {
    return sendTabMessage(tabs[0].id, msg);
  }
  throw new Error('No active tab');
});

// ─── 监听消息 ────────────────────────────────────────────────

chrome.runtime.onMessage.addListener(
  (message: ExtMessage, sender, sendResponse) => {
    router.route(message, sender).then(sendResponse).catch((error) => {
      console.error('[WAA] Message routing error:', error);
      sendResponse({ code: 1, message: error.message, data: null });
    });
    return true; // 保持 sendResponse 有效（异步响应）
  }
);

// ─── 长连接管理（用于 SSE 流式传输）──────────────────────────

chrome.runtime.onConnect.addListener((port) => {
  portManager.register(port);

  port.onMessage.addListener((message: ExtMessage) => {
    // 处理流式请求
    if (
      message.type === MessageType.AI_WRITING_START ||
      message.type === MessageType.AI_DIAGNOSIS_START
    ) {
      const chunkType =
        message.type === MessageType.AI_WRITING_START
          ? MessageType.AI_WRITING_CHUNK
          : MessageType.AI_DIAGNOSIS_CHUNK;
      const doneType =
        message.type === MessageType.AI_WRITING_START
          ? MessageType.AI_WRITING_DONE
          : MessageType.AI_DIAGNOSIS_DONE;

      const endpoint =
        message.type === MessageType.AI_WRITING_START
          ? '/api/ai/writing'
          : '/api/ai/diagnosis';

      sseRelay.startRelay(
        endpoint,
        message.payload,
        chunkType,
        doneType,
        (relayMsg) => {
          port.postMessage(relayMsg);
        }
      );
    }
  });
});

// ─── 扩展安装 / 更新 ────────────────────────────────────────

chrome.runtime.onInstalled.addListener((details) => {
  console.info('[WAA] Extension installed:', details.reason);

  if (details.reason === 'install') {
    // 首次安装，初始化默认配置
    storage.set('aiConfig', {
      mode: 'openai',
      openaiApiKey: '',
      openaiBaseUrl: 'https://api.openai.com/v1',
      openaiModel: 'gpt-4o-mini',
      ollamaBaseUrl: 'http://127.0.0.1:11434',
      ollamaModel: 'qwen2:7b',
    });
  }
});

// ─── 定时任务（健康检查）─────────────────────────────────────

chrome.alarms.create('health-check', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'health-check') {
    fetch('http://127.0.0.1:3456/api/health')
      .then((res) => {
        storage.setSession('serverConnected', res.ok);
      })
      .catch(() => {
        storage.setSession('serverConnected', false);
      });
  }
});

console.info('[WAA] Background service worker started');
