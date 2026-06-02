import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import TurndownService from 'turndown';

/**
 * 文章正文提取服务（使用 Readability + Turndown）
 */
export class ArticleExtractor {
  /**
   * 从 HTML 中提取文章内容
   */
  extract(
    html: string,
    url: string
  ): { title: string; content: string; markdown: string } {
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article) {
      throw new Error('Failed to extract article from HTML');
    }

    const turndown = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
    });
    const markdown = turndown.turndown(article.content);

    return {
      title: article.title,
      content: article.content,
      markdown,
    };
  }

  /**
   * 从 HTML 中提取纯文本
   */
  extractText(html: string, url: string): string {
    const result = this.extract(html, url);
    return result.markdown;
  }
}
