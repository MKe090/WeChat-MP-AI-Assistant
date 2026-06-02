import { FastifyInstance } from 'fastify';
import { AIService } from '../services/ai-service.js';
import { SensitiveWordsService } from '../services/sensitive-words.js';
import { aiRoutes } from './ai.js';
import { authRoutes } from './auth.js';
import { dataRoutes } from './data.js';
import { templateRoutes } from './template.js';
import { configRoutes } from './config.js';
import { wechatRoutes } from './wechat.js';
import { toolsRoutes } from './tools.js';
import { WechatOpenPlatformService } from '../services/wechat-open-platform.js';

/**
 * 注册所有路由
 */
export function registerRoutes(
  fastify: FastifyInstance,
  aiService: AIService,
  sensitiveWords: SensitiveWordsService,
  wechatService?: WechatOpenPlatformService
): void {
  aiRoutes(fastify, aiService, sensitiveWords);
  authRoutes(fastify);
  dataRoutes(fastify);
  templateRoutes(fastify);
  configRoutes(fastify);
  toolsRoutes(fastify);
  if (wechatService) {
    wechatRoutes(fastify, wechatService);
  }
}
