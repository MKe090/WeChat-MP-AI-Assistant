# Wechat260531 Runbook

## Scope

This directory is the new working version of the WeChat public account AI assistant.

Implemented local capabilities:

- Chrome MV3 extension build output in `chrome-extension/dist`
- Injected side panel for `mp.weixin.qq.com`
- AI writing, title optimization, AI formatting, diagnosis, violation check
- Yiban-style editor helpers: style snippets, templates, word count, short links, QR code, dark preview
- Local WeChat authorization flow with mock mode and real Open Platform mode hooks
- Local Fastify server, SQLite storage, mock AI mode for offline development

## Local Run

```bash
cd E:\Documents\wechat_AI\Wechat260531\local-server
npm install
npm run start
```

Service URL:

```text
http://127.0.0.1:3456
```

Build the extension:

```bash
cd E:\Documents\wechat_AI\Wechat260531\chrome-extension
npm install
npm run build
```

Load this directory in Chrome extensions:

```text
E:\Documents\wechat_AI\Wechat260531\chrome-extension\dist
```

## WeChat Authorization

Default local mode:

```env
WECHAT_AUTH_MOCK=true
```

This opens a local callback URL and writes a mock authorized account into SQLite.

For real WeChat Open Platform third-party authorization, set:

```env
WECHAT_AUTH_MOCK=false
WECHAT_COMPONENT_APPID=
WECHAT_COMPONENT_APPSECRET=
WECHAT_COMPONENT_VERIFY_TICKET=
WECHAT_REDIRECT_URI=http://127.0.0.1:3456/api/wechat/auth/callback
```

Real authorization requires a registered WeChat Open Platform third-party platform and a reachable callback URL configured in the platform console.

## Verified

- `local-server`: `npm run build`
- `chrome-extension`: `npm run build`
- `GET /api/health`
- `GET /api/config/ai-modes`
- `POST /api/ai/title-optimize`
- `POST /api/ai/writing`
- `GET /api/wechat/auth/start`
- `GET /api/wechat/auth/callback`
- `GET /api/wechat/authorizations`
- `POST /api/tools/short-links`
