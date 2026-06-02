import { ChatParams, AIProvider } from './openai-provider.js';

export class MockProvider implements AIProvider {
  async *chat(params: ChatParams): AsyncGenerator<string> {
    const text = [
      '# 本地 Mock AI 输出',
      '',
      '这是用于离线开发和自动化测试的模拟内容。',
      '',
      `用户输入：${params.userMessage.slice(0, 120)}`,
      '',
      '- 可验证 SSE 流式链路',
      '- 可在没有 API Key 时完成端到端测试',
    ].join('\n');

    for (const chunk of text.match(/.{1,24}/gs) || []) {
      yield chunk;
      await new Promise((resolve) => setTimeout(resolve, 2));
    }
  }

  async complete(params: ChatParams): Promise<string> {
    if (params.systemPrompt.includes('标题')) {
      return JSON.stringify({
        score: 82,
        originalTitle: params.userMessage,
        suggestedTitles: [
          { title: '3 个方法，让公众号文章更容易被点开', reason: '数字化表达，承诺明确' },
          { title: '别再凭感觉写标题：这套公式更稳', reason: '制造反差，强调方法' },
        ],
        analysis: 'Mock 模式下返回固定标题分析，用于验证前后端协议。',
      });
    }

    if (params.systemPrompt.includes('违规') || params.systemPrompt.includes('合规')) {
      return JSON.stringify({
        hasViolation: false,
        items: [],
        riskLevel: 'low',
        suggestions: ['Mock 模式未发现明显风险，请接入真实模型后复核。'],
      });
    }

    if (params.systemPrompt.includes('排版')) {
      return `<section style="line-height:1.8;font-size:15px;color:#333;"><p>${params.userMessage}</p></section>`;
    }

    return 'Mock 模式响应：请求已成功到达本地 AI 服务。';
  }
}
