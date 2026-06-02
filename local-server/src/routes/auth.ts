import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { getDb } from '../database/index.js';

/**
 * 认证路由（简化版：本地账号 + 密码）
 */
export function authRoutes(fastify: FastifyInstance): void {
  // 获取认证状态
  fastify.get('/api/auth/status', async (request) => {
    const token = request.headers.authorization?.replace(
      'Bearer ',
      ''
    );
    if (!token) {
      return {
        code: 0,
        data: { authenticated: false, user: null },
        message: 'ok',
      };
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret) as any;
      const db = getDb();
      const user = db
        .prepare(
          `SELECT id, email, name, ai_mode, openai_api_key,
                  ollama_base_url, ollama_model
           FROM users WHERE id = ?`
        )
        .get(decoded.userId);
      return {
        code: 0,
        data: { authenticated: true, user },
        message: 'ok',
      };
    } catch {
      return {
        code: 0,
        data: { authenticated: false, user: null },
        message: 'ok',
      };
    }
  });

  // 登录
  fastify.post('/api/auth/login', async (request) => {
    const { email, password } = request.body as any;
    if (!email || !password) {
      return { code: 10001, data: null, message: '邮箱和密码不能为空' };
    }

    const db = getDb();
    const user = db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(email) as any;

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return { code: 10002, data: null, message: '邮箱或密码错误' };
    }

    const token = jwt.sign(
      { userId: user.id },
      config.jwtSecret,
      { expiresIn: '30d' }
    );

    return {
      code: 0,
      data: {
        token,
        user: { id: user.id, email: user.email, name: user.name },
      },
      message: 'ok',
    };
  });

  // 注册
  fastify.post('/api/auth/register', async (request) => {
    const { email, password, name } = request.body as any;
    if (!email || !password || !name) {
      return { code: 10001, data: null, message: '所有字段必填' };
    }

    const db = getDb();
    const existing = db
      .prepare('SELECT id FROM users WHERE email = ?')
      .get(email);
    if (existing) {
      return { code: 10001, data: null, message: '邮箱已注册' };
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const id = crypto.randomUUID();

    db.prepare(
      'INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)'
    ).run(id, email, name, passwordHash);

    const token = jwt.sign({ userId: id }, config.jwtSecret, {
      expiresIn: '30d',
    });

    return {
      code: 0,
      data: { token, user: { id, email, name } },
      message: 'ok',
    };
  });
}
