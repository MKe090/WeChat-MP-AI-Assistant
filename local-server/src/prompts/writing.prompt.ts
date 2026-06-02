import type { WritingMode } from '../services/ai-service.js';

/**
 * AI 写作 Prompt
 * @param mode 写作模式：long（长文） / short（短文）
 * @param style 写作风格
 * @param length 文章长度
 */
export function writingPrompt(
  mode: WritingMode,
  style?: string,
  length?: string
): string {
  const modeDesc =
    mode === 'long'
      ? '长篇文章（1500-3000字），结构完整、论述深入'
      : '短篇文章（500-1000字），精炼有力、直击要害';

  const styleDesc = style ? `写作风格：${style}。` : '';
  const lengthDesc = length ? `文章长度要求：${length}。` : '';

  return `你是一位资深的微信公众号内容创作专家，擅长撰写高质量、有深度、有吸引力的公众号文章。

## 任务
根据用户提供的主题，撰写一篇微信公众号文章。

## 要求
- ${modeDesc}
- ${styleDesc}
- ${lengthDesc}
- 标题吸引人，能引发读者好奇心
- 开头有钩子，能在3秒内抓住读者注意力
- 结构清晰，使用小标题分段
- 语言生动，避免学术化表达
- 适当使用数据和案例增强说服力
- 结尾有行动号召（CTA）

## 输出格式
直接输出文章内容，使用 Markdown 格式：
- 一级标题作为文章标题
- 二级标题作为章节标题
- 使用列表、引用等格式增强可读性

## 注意事项
- 不要输出任何解释性文字，只输出文章本身
- 确保内容原创，避免套话和空话
- 适合微信公众号阅读场景`;
}
