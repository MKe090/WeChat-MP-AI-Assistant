import dotenv from 'dotenv';
import pino from 'pino';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3456', 10),
  host: process.env.HOST || '127.0.0.1',
  jwtSecret:
    process.env.JWT_SECRET || 'waa-secret-key-change-in-production',
  aiMode: process.env.AI_MODE || (process.env.AI_MOCK === 'true' ? 'mock' : 'openai'),
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiBaseUrl:
    process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  ollamaBaseUrl:
    process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
  ollamaModel: process.env.OLLAMA_MODEL || 'qwen2:7b',
  wechatAuthMock: process.env.WECHAT_AUTH_MOCK !== 'false',
  wechatComponentAppId: process.env.WECHAT_COMPONENT_APPID || '',
  wechatComponentAppSecret: process.env.WECHAT_COMPONENT_APPSECRET || '',
  wechatComponentVerifyTicket: process.env.WECHAT_COMPONENT_VERIFY_TICKET || '',
  wechatRedirectUri:
    process.env.WECHAT_REDIRECT_URI ||
    `http://${process.env.HOST || '127.0.0.1'}:${process.env.PORT || '3456'}/api/wechat/auth/callback`,
  dbPath: process.env.DB_PATH || './data/waa.db',
};

/** 允许的 CORS 来源列表 */
export const ALLOWED_ORIGINS = [
  'http://127.0.0.1:3456',
  'http://localhost:3456',
  'https://mp.weixin.qq.com',
  'chrome-extension://',
  'http://localhost:',
  'http://127.0.0.1:',
];

export const logger = pino({ level: 'info' });
