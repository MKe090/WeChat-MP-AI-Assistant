import DOMPurify from 'dompurify';

/**
 * HTML 消毒工具：使用 DOMPurify 过滤危险标签和属性
 * 用于所有 dangerouslySetInnerHTML 场景，防止 XSS 注入
 */

/** 允许的 HTML 标签 */
const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
  'span', 'div', 'section', 'article', 'header', 'footer', 'main',
  'img', 'a', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'hr', 'figure', 'figcaption', 'mark', 'sub', 'sup',
];

/** 允许的 HTML 属性 */
const ALLOWED_ATTR = [
  'class', 'style', 'src', 'alt', 'href', 'title', 'target',
  'width', 'height', 'colspan', 'rowspan', 'id',
];

/**
 * 消毒 HTML 内容，移除危险标签和属性
 * @param html 原始 HTML 字符串
 * @returns 清理后的安全 HTML 字符串
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  });
}
