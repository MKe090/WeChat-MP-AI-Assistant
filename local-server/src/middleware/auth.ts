import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

/**
 * 不需要认证的公开路由路径
 */
const PUBLIC_PATHS = [
  '/api/health',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/status',
];

/**
 * JWT 认证中间件
 * 验证请求头中的 Bearer Token，强制执行认证策略
 */
export function authMiddleware(
  fastify: FastifyInstance
): void {
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    // 跳过不需要认证的公开路由
    if (PUBLIC_PATHS.includes(request.url)) {
      return;
    }

    // 跳过 CORS preflight 请求
    if (request.method === 'OPTIONS') {
      return;
    }

    // 检查 Authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      reply.status(401).send({
        code: 401,
        data: null,
        message: 'Authorization required',
      });
      return;
    }

    // 验证 Token
    const token = authHeader.replace('Bearer ', '');
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as any;
      (request as any).userId = decoded.userId;
    } catch {
      reply.status(401).send({
        code: 401,
        data: null,
        message: 'Invalid or expired token',
      });
      return;
    }
  });
}
