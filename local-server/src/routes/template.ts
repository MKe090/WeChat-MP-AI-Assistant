import { FastifyInstance } from 'fastify';
import { getDb } from '../database/index.js';

/**
 * 模板路由
 */
export function templateRoutes(fastify: FastifyInstance): void {
  // 获取模板列表
  fastify.get('/api/templates', async () => {
    const db = getDb();
    const templates = db
      .prepare('SELECT * FROM templates ORDER BY created_at DESC')
      .all();
    return { code: 0, data: { templates }, message: 'ok' };
  });

  // 获取单个模板
  fastify.get('/api/templates/:id', async (request) => {
    const { id } = request.params as any;
    const db = getDb();
    const template = db
      .prepare('SELECT * FROM templates WHERE id = ?')
      .get(id);
    if (!template) {
      return { code: 10003, data: null, message: '模板不存在' };
    }
    return { code: 0, data: { template }, message: 'ok' };
  });

  // 创建模板
  fastify.post('/api/templates', async (request) => {
    const { name, category, styleHtml, styleCss, preview } =
      request.body as any;
    if (!name) {
      return { code: 10001, data: null, message: '模板名称不能为空' };
    }

    const db = getDb();
    const id = crypto.randomUUID();

    db.prepare(
      `INSERT INTO templates (id, user_id, name, category, style_html, style_css, preview)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(id, 'default', name, category || '', styleHtml || '', styleCss || '', preview || '');

    return { code: 0, data: { id }, message: 'ok' };
  });

  // 更新模板
  fastify.put('/api/templates/:id', async (request) => {
    const { id } = request.params as any;
    const { name, category, styleHtml, styleCss, preview } =
      request.body as any;
    const db = getDb();

    const existing = db
      .prepare('SELECT id FROM templates WHERE id = ?')
      .get(id);
    if (!existing) {
      return { code: 10003, data: null, message: '模板不存在' };
    }

    db.prepare(
      `UPDATE templates
       SET name = COALESCE(?, name),
           category = COALESCE(?, category),
           style_html = COALESCE(?, style_html),
           style_css = COALESCE(?, style_css),
           preview = COALESCE(?, preview)
       WHERE id = ?`
    ).run(name, category, styleHtml, styleCss, preview, id);

    return { code: 0, data: { success: true }, message: 'ok' };
  });

  // 删除模板
  fastify.delete('/api/templates/:id', async (request) => {
    const { id } = request.params as any;
    const db = getDb();
    db.prepare('DELETE FROM templates WHERE id = ?').run(id);
    return { code: 0, data: { success: true }, message: 'ok' };
  });
}
