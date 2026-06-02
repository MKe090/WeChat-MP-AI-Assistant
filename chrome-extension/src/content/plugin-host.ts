import { BasePlugin } from './plugins/base-plugin';
import { EditorAdapter } from './editor-adapter';
import { EditorObserver } from './editor-observer';
import { ExtMessage } from '../shared/types';

/**
 * 插件宿主：注册 / 管理功能插件
 */
export class PluginHost {
  private plugins = new Map<string, BasePlugin>();
  private editorAdapter: EditorAdapter;
  private editorObserver: EditorObserver;

  constructor(
    editorAdapter: EditorAdapter,
    editorObserver: EditorObserver
  ) {
    this.editorAdapter = editorAdapter;
    this.editorObserver = editorObserver;
  }

  /**
   * 注册插件
   */
  register(plugin: BasePlugin): void {
    this.plugins.set(plugin.name, plugin);
    console.info(`[WAA] Plugin registered: ${plugin.name}`);
  }

  /**
   * 注销插件
   */
  unregister(name: string): void {
    const plugin = this.plugins.get(name);
    if (plugin) {
      plugin.deactivate();
      this.plugins.delete(name);
      console.info(`[WAA] Plugin unregistered: ${name}`);
    }
  }

  /**
   * 初始化所有已注册的插件
   */
  initialize(): void {
    for (const plugin of this.plugins.values()) {
      plugin.activate();
    }
    console.info(
      `[WAA] ${this.plugins.size} plugins initialized`
    );
  }

  /**
   * 获取指定名称的插件
   */
  getPlugin(name: string): BasePlugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * 处理来自 Background 的消息，分发给所有插件
   */
  handleMessage(message: ExtMessage): void {
    for (const plugin of this.plugins.values()) {
      plugin.onMessage(message);
    }
  }

  /**
   * 获取编辑器适配器
   */
  getEditorAdapter(): EditorAdapter {
    return this.editorAdapter;
  }

  /**
   * 获取编辑器监听器
   */
  getEditorObserver(): EditorObserver {
    return this.editorObserver;
  }
}
