/**
 * CORS 配置
 * 已在 index.ts 中通过 @fastify/cors 注册，此文件作为额外配置参考
 */

/**
 * 允许的来源列表
 */
export const ALLOWED_ORIGINS = [
  'chrome-extension://*',
  'http://127.0.0.1:3456',
  'https://mp.weixin.qq.com',
];

/**
 * CORS 配置选项
 * 实际配置已在 main 中通过 @fastify/cors 注册
 */
export const corsOptions = {
  origin: true as const,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
