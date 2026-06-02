import { FastifyInstance } from 'fastify';
import { config } from '../config.js';
import { AIService, AIModeType } from '../services/ai-service.js';

export function configRoutes(fastify: FastifyInstance): void {
  fastify.get('/api/config/ai-modes', async () => {
    const aiService = (fastify as any).aiService as AIService;
    return {
      code: 0,
      data: {
        currentMode: aiService?.getCurrentMode() || config.aiMode,
        openai: {
          baseUrl: config.openaiBaseUrl,
          model: config.openaiModel,
        },
        ollama: {
          baseUrl: config.ollamaBaseUrl,
          model: config.ollamaModel,
        },
        mock: { enabled: true },
      },
      message: 'ok',
    };
  });

  const switchMode = async (request: any) => {
    const { mode, customApiKey, customBaseUrl, customModel } = request.body as any;

    if (!mode || !['openai', 'ollama', 'custom', 'mock'].includes(mode)) {
      return {
        code: 10001,
        data: null,
        message: '无效的 AI 模式，支持：openai / ollama / custom / mock',
      };
    }

    if (mode === 'custom' && (!customBaseUrl || !customModel)) {
      return {
        code: 10001,
        data: null,
        message: '自定义模式需要提供 customBaseUrl 和 customModel',
      };
    }

    const aiService = (fastify as any).aiService as AIService;
    if (aiService) {
      if (mode === 'custom') {
        aiService.switchProvider('custom', {
          apiKey: customApiKey || '',
          baseURL: customBaseUrl,
          model: customModel,
        });
      } else {
        aiService.switchProvider(mode as AIModeType);
      }
    }

    return {
      code: 0,
      data: { success: true, currentMode: mode },
      message: 'ok',
    };
  };

  fastify.put('/api/config/ai-mode', switchMode);
  fastify.post('/api/config/ai-mode', switchMode);
}
