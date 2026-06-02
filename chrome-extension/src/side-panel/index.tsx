import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

/**
 * 将侧边面板 React 应用挂载到指定的容器（Shadow DOM 内部）
 * 由 Content Script 调用
 * @param container React 挂载容器
 * @param styleContainer emotion CSS 缓存容器（确保 MUI 样式注入到 Shadow DOM）
 */
export function mountSidePanel(
  container: HTMLElement,
  styleContainer: HTMLElement
): void {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App styleContainer={styleContainer} />
    </React.StrictMode>
  );
  console.info('[WAA] Side panel React app mounted');
}
