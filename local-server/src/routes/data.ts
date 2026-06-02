import { FastifyInstance } from 'fastify';
import { getDb } from '../database/index.js';

/**
 * 数据路由
 */
export function dataRoutes(fastify: FastifyInstance): void {
  // 获取文章数据
  fastify.get('/api/data/articles', async () => {
    const db = getDb();
    const articles = db
      .prepare(
        'SELECT * FROM articles ORDER BY publish_time DESC LIMIT 50'
      )
      .all();
    return { code: 0, data: { articles }, message: 'ok' };
  });

  // 数据看板
  fastify.get('/api/data/dashboard', async () => {
    const db = getDb();

    const totalArticles = db
      .prepare('SELECT COUNT(*) as count FROM articles')
      .get() as any;

    const avgStats = db
      .prepare(
        `SELECT
          AVG(read_count) as avgReadCount,
          AVG(like_count) as avgLikeCount,
          AVG(share_count) as avgShareCount
        FROM articles`
      )
      .get() as any;

    const topArticles = db
      .prepare(
        'SELECT * FROM articles ORDER BY read_count DESC LIMIT 5'
      )
      .all();

    return {
      code: 0,
      data: {
        overview: {
          totalArticles: totalArticles?.count || 0,
          avgReadCount: Math.round(avgStats?.avgReadCount || 0),
          avgLikeCount: Math.round(avgStats?.avgLikeCount || 0),
          avgShareCount: Math.round(avgStats?.avgShareCount || 0),
        },
        topArticles,
        trends: [],
      },
      message: 'ok',
    };
  });
}
