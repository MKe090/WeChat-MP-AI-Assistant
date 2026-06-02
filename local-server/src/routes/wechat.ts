import { FastifyInstance } from 'fastify';
import { WechatOpenPlatformService } from '../services/wechat-open-platform.js';

export function wechatRoutes(
  fastify: FastifyInstance,
  wechatService: WechatOpenPlatformService
): void {
  fastify.get('/api/wechat/auth/start', async () => {
    const auth = await wechatService.createAuthorization();
    return { code: 0, data: auth, message: 'ok' };
  });

  fastify.get('/api/wechat/auth/callback', async (request, reply) => {
    const { auth_code: authCode } = request.query as any;
    const data = await wechatService.handleCallback(authCode);
    reply.type('text/html; charset=utf-8');
    return `
      <!doctype html>
      <html>
        <head><meta charset="utf-8"><title>公众号授权成功</title></head>
        <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:32px;">
          <h2>公众号授权成功</h2>
          <p>已授权：${escapeHtml(data.authorizer_info?.nick_name || data.authorization_info?.authorizer_appid || '')}</p>
          <p>你可以关闭此页面，回到插件面板继续使用。</p>
        </body>
      </html>
    `;
  });

  fastify.get('/api/wechat/authorizations', async () => {
    return {
      code: 0,
      data: { authorizations: wechatService.listAuthorizations() },
      message: 'ok',
    };
  });
}

function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
