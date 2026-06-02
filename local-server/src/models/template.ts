/** 模板数据模型 */
export interface TemplateModel {
  id: string;
  user_id: string;
  name: string;
  category: string;
  style_html: string;
  style_css: string;
  preview: string;
  created_at: string;
}

/** 创建模板参数 */
export interface CreateTemplateParams {
  id: string;
  user_id: string;
  name: string;
  category?: string;
  style_html?: string;
  style_css?: string;
  preview?: string;
}
