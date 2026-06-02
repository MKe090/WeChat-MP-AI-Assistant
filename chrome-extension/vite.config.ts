import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync, writeFileSync, readFileSync } from 'fs';
import { build as esbuildBuild } from 'esbuild';

const projectRoot = resolve(__dirname);

export default defineConfig({
  plugins: [
    react(),
    // 构建后处理
    {
      name: 'post-build-process',
      async closeBundle() {
        const distDir = resolve(projectRoot, 'dist');

        // ── 1. 用 esbuild 将 content-script.js 从 ESM 重新打包为 IIFE ──
        // Chrome content_scripts 不支持 ES Module 的 import 语法
        const contentScriptPath = resolve(distDir, 'content-script.js');
        if (existsSync(contentScriptPath)) {
          try {
            await esbuildBuild({
              entryPoints: [contentScriptPath],
              bundle: true,
              format: 'iife',
              target: 'chrome110',
              outfile: contentScriptPath, // 覆盖原文件
              allowOverwrite: true,
              sourcemap: true,
              // IIFE 不需要 export
              footer: { js: '' },
            });
            console.log('[WAA] Rebuilt content-script.js as IIFE format');
          } catch (err) {
            console.error('[WAA] Failed to rebuild content-script as IIFE:', err);
          }
        }

        // ── 2. 同样处理 background.js — 也用 IIFE，移除 type:module ──
        // 注意：background.js 使用 ESM 是因为 manifest 声明了 type: "module"
        // 保持 ESM 不变，background 可以用 import

        // ── 3. 复制图标 ──
        const iconsDir = resolve(distDir, 'icons');
        if (!existsSync(iconsDir)) mkdirSync(iconsDir, { recursive: true });
        for (const size of ['16', '48', '128']) {
          const src = resolve(projectRoot, `public/icons/icon${size}.png`);
          if (existsSync(src)) {
            copyFileSync(src, resolve(iconsDir, `icon${size}.png`));
          }
        }

        // ── 4. 生成内容脚本 CSS ──
        const assetsDir = resolve(distDir, 'assets');
        if (!existsSync(assetsDir)) mkdirSync(assetsDir, { recursive: true });

        const sidePanelCss = resolve(projectRoot, 'src/styles/side-panel.css');
        const toolbarCss = resolve(projectRoot, 'src/styles/editor-toolbar.css');

        let contentCss = '';
        try {
          if (existsSync(sidePanelCss)) {
            contentCss += '/* Side Panel Styles */\n';
            contentCss += readFileSync(sidePanelCss, 'utf-8');
          }
        } catch { /* skip */ }
        try {
          if (existsSync(toolbarCss)) {
            contentCss += '\n/* Editor Toolbar Styles */\n';
            contentCss += readFileSync(toolbarCss, 'utf-8');
          }
        } catch { /* skip */ }

        writeFileSync(resolve(assetsDir, 'content-styles.css'), contentCss);

        // ── 5. 生成 manifest.json ──
        const manifest = {
          manifest_version: 3,
          name: '微信公众号AI助手',
          description: 'AI驱动的公众号内容创作助手',
          version: '0.1.0',
          minimum_chrome_version: '110',
          icons: {
            '16': 'icons/icon16.png',
            '48': 'icons/icon48.png',
            '128': 'icons/icon128.png',
          },
          action: {
            default_popup: 'popup.html',
            default_icon: 'icons/icon128.png',
          },
          background: {
            service_worker: 'background.js',
            type: 'module',
          },
          content_scripts: [
            {
              matches: ['https://mp.weixin.qq.com/*'],
              css: ['assets/content-styles.css'],
              js: ['content-script.js'],
              run_at: 'document_idle',
            },
          ],
          permissions: ['storage', 'tabs', 'activeTab', 'alarms', 'contextMenus'],
          host_permissions: [
            'http://127.0.0.1:3456/*',
            'https://mp.weixin.qq.com/*',
          ],
          externally_connectable: {
            matches: ['http://127.0.0.1:3456/*'],
          },
        };

        writeFileSync(
          resolve(distDir, 'manifest.json'),
          JSON.stringify(manifest, null, 2)
        );
      },
    },
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        background: resolve(__dirname, 'src/background/index.ts'),
        'content-script': resolve(__dirname, 'src/content/index.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
    target: 'chrome110',
    minify: false,
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
