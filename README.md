# 公众号 AI 助手
AI驱动的公众号内容创作效率助手

一个面向微信公众号草稿编辑页的浏览器增强工具，包含 Chrome 扩展和本地 Fastify 服务。项目目标是把 AI 写作、标题优化、排版增强、违规检测、公众号授权和图文编辑工具箱整合到公众号编辑器侧边栏中。

> 说明：本项目是学习和自用型开源项目，不隶属于微信、腾讯或壹伴。界面布局参考了公众号编辑器常见插件工作流，但代码和实现均为独立实现。

## 功能

- 公众号编辑页注入：右侧图文工具箱、左侧样式/素材库、中间增强工具条。
- AI 写作：按主题生成长文或短文。
- 标题优化：标题评分、问题分析和候选标题建议。
- AI 排版：将正文转换为更适合公众号发布的 HTML 样式。
- 违规检测：基于本地敏感词和 AI 建议进行风险提示。
- 内容诊断：对文章结构、传播性和运营策略给出建议。
- 公众号授权：支持本地 mock 授权；配置微信开放平台第三方平台参数后可跳转官方扫码授权。
- 编辑增强：HTML 源码编辑、样式块插入、图片居中、二维码、短链等工具。

## 项目结构

```text
.
├── chrome-extension/      # Chrome 扩展，React + TypeScript + Vite
├── local-server/          # 本地服务，Fastify + SQLite
├── docs/                  # 架构、PRD、流程图和运行手册
├── scripts/               # smoke test 脚本
├── package.json           # 根目录聚合脚本
└── README.md
```

## 环境要求

- Node.js 18+
- npm 9+
- Chrome 或 Chromium 浏览器
- 可选：OpenAI 兼容 API Key 或本地 Ollama
- 可选：微信开放平台第三方平台账号，用于真实公众号扫码授权

## 快速开始

安装依赖：

```powershell
cd E:\Documents\wechat_AI\Wechat260531
npm run install:all
```

配置本地服务：

```powershell
cd E:\Documents\wechat_AI\Wechat260531\local-server
Copy-Item .env.example .env
```

默认 `.env.example` 使用 mock 模式，可以不填 API Key 直接启动。

启动本地服务：

```powershell
cd E:\Documents\wechat_AI\Wechat260531
npm run start:server
```

健康检查：

```powershell
Invoke-RestMethod http://127.0.0.1:3456/api/health
```

返回 `code: 0` 且 `data.status: ok` 表示本地服务已启动。

构建扩展：

```powershell
cd E:\Documents\wechat_AI\Wechat260531
npm run build
```

加载 Chrome 扩展：

1. 打开 `chrome://extensions/`
2. 开启“开发者模式”
3. 点击“加载已解压的扩展程序”
4. 选择 `chrome-extension/dist`
5. 打开微信公众号草稿编辑页，扩展会注入工具箱

## 公众号扫码授权

本地开发默认使用 mock 授权：

```env
WECHAT_AUTH_MOCK=true
```

点击“公众号扫码授权”后，会打开本地回调页并写入一条测试授权记录。

如果要接入真实微信开放平台第三方平台授权，需要改为：

```env
WECHAT_AUTH_MOCK=false
WECHAT_COMPONENT_APPID=你的第三方平台AppID
WECHAT_COMPONENT_APPSECRET=你的第三方平台AppSecret
WECHAT_COMPONENT_VERIFY_TICKET=微信推送的ticket
WECHAT_REDIRECT_URI=http://127.0.0.1:3456/api/wechat/auth/callback
```

真实授权还需要在微信开放平台后台配置授权事件接收 URL、消息校验 Token、EncodingAESKey 和回调域名。本项目当前实现了本地授权跳转、回调处理和授权记录保存；生产化仍需补齐微信开放平台事件推送校验、ticket 持久刷新和安全加密配置。

## 常用命令

```powershell
# 安装两个子项目依赖
npm run install:all

# 构建本地服务和 Chrome 扩展
npm run build

# 启动本地服务
npm run start:server

# 运行本地冒烟测试
npm run smoke
```

## 本地服务端口检查

```powershell
Get-NetTCPConnection -LocalAddress 127.0.0.1 -LocalPort 3456 -ErrorAction SilentlyContinue
```

如果没有输出，说明服务没有监听 `3456`。

查看监听进程：

```powershell
$pid = (Get-NetTCPConnection -LocalAddress 127.0.0.1 -LocalPort 3456).OwningProcess
Get-CimInstance Win32_Process -Filter "ProcessId = $pid" | Select-Object ProcessId,CommandLine
```

## 技术栈

Chrome 扩展：

- React 18
- TypeScript
- Vite
- MUI
- Zustand
- Chrome Extension Manifest V3
- Shadow DOM 注入

本地服务：

- Fastify
- SQLite / better-sqlite3
- OpenAI SDK
- Ollama HTTP API
- Server-Sent Events
- JWT

## 开源许可

本项目使用 [Apache License 2.0](./LICENSE)。
