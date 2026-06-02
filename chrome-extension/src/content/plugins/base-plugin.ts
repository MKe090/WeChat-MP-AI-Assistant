import { PluginHost } from '../plugin-host';
import { EditorAdapter } from '../editor-adapter';
import { ExtMessage, MessageType } from '../../shared/types';
import { createMessage, sendMessage } from '../../shared/messages';

/**
 * 插件基类：所有功能插件继承此类
 *
 * 子类需要实现：
 * - name: 插件名称
 * - onActivate(): 激活时的初始化逻辑
 * - onDeactivate(): 停用时的清理逻辑
 * - onMessage(): 接收消息的处理逻辑
 */
export abstract class BasePlugin {
  abstract name: string;

  protected host!: PluginHost;
  protected editorAdapter!: EditorAdapter;
  protected active: boolean = false;

  /**
   * 激活插件
   */
  activate(): void {
    this.active = true;
    this.onActivate();
  }

  /**
   * 停用插件
   */
  deactivate(): void {
    this.active = false;
    this.onDeactivate();
  }

  /**
   * 接收来自 Background 的消息
   * 子类可覆写此方法以处理特定消息
   */
  onMessage(_message: ExtMessage): void {
    // 默认不处理
  }

  /**
   * 激活时的初始化逻辑
   * 子类覆写
   */
  protected onActivate(): void {
    // 子类覆写
  }

  /**
   * 停用时的清理逻辑
   * 子类覆写
   */
  protected onDeactivate(): void {
    // 子类覆写
  }

  /**
   * 发送消息到 Background Service Worker
   */
  protected async sendToBackground(
    type: MessageType,
    payload?: any
  ): Promise<any> {
    const msg = createMessage(type, 'content-script', payload);
    return sendMessage(msg);
  }

  /**
   * 获取插件是否处于激活状态
   */
  isActive(): boolean {
    return this.active;
  }

  /**
   * 注入插件宿主引用（由 PluginHost 调用）
   */
  _setHost(host: PluginHost): void {
    this.host = host;
    this.editorAdapter = host.getEditorAdapter();
  }
}
