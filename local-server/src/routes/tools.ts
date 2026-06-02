import { FastifyInstance } from 'fastify';
import { getDb } from '../database/index.js';

export function toolsRoutes(fastify: FastifyInstance): void {
  fastify.post('/api/tools/short-links', async (request) => {
    const { url, title } = request.body as any;
    if (!url || !/^https?:\/\//i.test(url)) {
      return { code: 10001, data: null, message: '请输入有效的 http/https 链接' };
    }

    const slug = createSlug();
    getDb()
      .prepare(
        `INSERT INTO short_links (slug, url, title)
         VALUES (?, ?, ?)`
      )
      .run(slug, url, title || '');

    return {
      code: 0,
      data: {
        slug,
        url,
        shortUrl: `http://127.0.0.1:3456/s/${slug}`,
      },
      message: 'ok',
    };
  });

  fastify.get('/api/tools/short-links', async () => {
    const links = getDb()
      .prepare('SELECT slug, url, title, created_at FROM short_links ORDER BY created_at DESC LIMIT 50')
      .all();
    return { code: 0, data: { links }, message: 'ok' };
  });

  fastify.get('/s/:slug', async (request, reply) => {
    const { slug } = request.params as any;
    const row = getDb()
      .prepare('SELECT url FROM short_links WHERE slug = ?')
      .get(slug) as any;
    if (!row) {
      reply.status(404);
      return 'Short link not found';
    }
    reply.redirect(row.url);
  });
}

function createSlug(): string {
  return Math.random().toString(36).slice(2, 8);
}
