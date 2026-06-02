import { FastifyInstance } from 'fastify';
import { AIService } from '../services/ai-service.js';
import { SensitiveWordsService } from '../services/sensitive-words.js';

/**
 * AI 相关路由
 */
export function aiRoutes(
  fastify: FastifyInstance,
  aiService: AIService,
  sensitiveWords: SensitiveWordsService
): void {
  // AI 写作（SSE 流式）
  fastify.post('/api/ai/writing', async (request, reply) => {
    const { topic, mode, style, length, writingTypePrompt } = request.body as any;

    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    try {
      for await (const chunk of aiService.writing({
        topic,
        mode,
        style,
        length,
        writingTypePrompt,
      })) {
        reply.raw.write(`data: ${JSON.stringify(chunk)}\n\n`);
        if (chunk.done) break;
      }
    } catch (error: any) {
      reply.raw.write(
        `data: ${JSON.stringify({
          chunk: '',
          done: true,
          error: error.message,
        })}\n\n`
      );
    }

    reply.raw.end();
  });

  // 标题优化
  fastify.post('/api/ai/title-optimize', async (request) => {
    const { title, content } = request.body as any;
    const result = await aiService.titleOptimize(title, content);
    return { code: 0, data: result, message: 'ok' };
  });

  // AI 排版
  fastify.post('/api/ai/formatting', async (request) => {
    const { html, styleName } = request.body as any;
    const result = await aiService.formatting(html, styleName);
    return { code: 0, data: result, message: 'ok' };
  });

  // 排版预览
  fastify.post('/api/ai/formatting-preview', async (request) => {
    const { html, styleName } = request.body as any;
    const result = await aiService.formattingPreview(html, styleName);
    return { code: 0, data: result, message: 'ok' };
  });

  // 内容诊断（SSE 流式）
  fastify.post('/api/ai/diagnosis', async (request, reply) => {
    const { articles } = request.body as any;

    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    try {
      for await (const chunk of aiService.diagnosis(articles)) {
        reply.raw.write(`data: ${JSON.stringify(chunk)}\n\n`);
        if (chunk.done) break;
      }
    } catch (error: any) {
      reply.raw.write(
        `data: ${JSON.stringify({
          chunk: '',
          done: true,
          error: error.message,
        })}\n\n`
      );
    }

    reply.raw.end();
  });

  // 违规检测（合并本地敏感词扫描 + AI 检测）
  fastify.post('/api/ai/violation-check', async (request) => {
    const { content } = request.body as any;

    // 1. 先执行本地敏感词扫描
    const localMatches = sensitiveWords.scan(content || '');

    // 2. 再调用 AI 检测
    const aiResult = await aiService.violationCheck(content);

    // 3. 合并结果，去重
    const existingTexts = new Set(aiResult.items.map((item: any) => item.text));
    const mergedItems = [
      ...aiResult.items,
      ...localMatches.filter((item) => !existingTexts.has(item.text)),
    ];

    // 4. 根据合并后的结果重新评估风险等级
    const hasViolation = aiResult.hasViolation || localMatches.length > 0;
    let riskLevel: 'low' | 'medium' | 'high' = aiResult.riskLevel;
    if (localMatches.length > 5) {
      riskLevel = 'high';
    } else if (localMatches.length > 2 && riskLevel !== 'high') {
      riskLevel = 'medium';
    }

    // 5. 合并建议
    const localSuggestions =
      localMatches.length > 0
        ? [`检测到 ${localMatches.length} 个敏感词，建议修改或替换`]
        : [];

    return {
      code: 0,
      data: {
        hasViolation,
        items: mergedItems,
        riskLevel,
        suggestions: [...aiResult.suggestions, ...localSuggestions],
      },
      message: 'ok',
    };
  });
}
