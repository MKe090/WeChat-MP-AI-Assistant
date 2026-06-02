import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config, logger, ALLOWED_ORIGINS } from './config.js';
import { registerRoutes } from './routes/index.js';
import { initializeDatabase } from './database/index.js';
import { AIService } from './services/ai-service.js';
import { SensitiveWordsService } from './services/sensitive-words.js';
import { WechatOpenPlatformService } from './services/wechat-open-platform.js';

async function main() {
  const fastify = Fastify({
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: { colorize: true },
      },
    },
  });

  // 注册 CORS（限制允许的来源）
  await fastify.register(cors, {
    origin: (origin: string | undefined, callback: (err: Error | null, allow: boolean) => void) => {
      // 允许无 origin 的请求（如 Chrome 扩展、Postman）
      if (!origin) {
        callback(null, true);
        return;
      }
      if (ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed))) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
  });

  // 初始化数据库
  initializeDatabase();
  logger.info('Database initialized');

  // 初始化 AI 服务
  const aiService = new AIService();

  // 将 aiService 挂载到 Fastify 实例，供路由使用
  fastify.decorate('aiService', aiService);

  // 初始化敏感词服务
  const sensitiveWords = new SensitiveWordsService();
  sensitiveWords.loadBuiltIn();
  const wechatService = new WechatOpenPlatformService();

  // 注册全局错误处理
  fastify.setErrorHandler((error, request, reply) => {
    logger.error(
      { error: error.message, url: request.url },
      'Unhandled error'
    );
    reply.status(500).send({
      code: 500,
      data: null,
      message: error.message || 'Internal Server Error',
    });
  });

  // 注册路由
  registerRoutes(fastify, aiService, sensitiveWords, wechatService);

  // 根路由（服务状态页）
  fastify.get('/', async () => {
    return {
      code: 0,
      data: {
        name: '微信公众号AI助手 - 本地服务',
        version: '0.1.0',
        status: 'running',
        aiMode: aiService.getCurrentMode(),
        timestamp: Date.now(),
      },
      message: 'ok',
    };
  });

  // 健康检查端点
  fastify.get('/api/health', async () => {
    return { code: 0, data: { status: 'ok', timestamp: Date.now() }, message: 'ok' };
  });

  // 启动服务
  try {
    await fastify.listen({ port: config.port, host: config.host });
    logger.info(
      `Local server running at http://${config.host}:${config.port}`
    );
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}

main();
