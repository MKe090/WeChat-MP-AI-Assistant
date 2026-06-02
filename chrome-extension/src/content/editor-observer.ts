import { WX_SELECTORS } from '../shared/constants';

/**
 * 编辑器监听器：监听微信编辑器 DOM 变更和内容变化
 * 使用增强的选择器列表，兼容 UEditor 多种 DOM 结构
 */
export class EditorObserver {
  private observer: MutationObserver | null = null;
  private onEditorReadyCallbacks: (() => void)[] = [];
  private onContentChangeCallbacks: (() => void)[] = [];
  private editorReady: boolean = false;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly debounceMs: number = 300;
  private retryCount: number = 0;
  private readonly maxRetries: number = 30;

  /**
   * 开始监听编辑器
   */
  startWatch(): void {
    const editorEl = this.findEditor();
    if (!editorEl) {
      // 编辑器可能还没加载，延迟重试（最多 30 次，约 30 秒）
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        setTimeout(() => this.startWatch(), 1000);
      } else {
        console.warn('[WAA] Editor not found after max retries, giving up');
      }
      return;
    }

    this.retryCount = 0;

    this.observer = new MutationObserver(() => {
      this.notifyContentChange();
    });

    this.observer.observe(editorEl, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    this.editorReady = true;
    this.onEditorReadyCallbacks.forEach((cb) => cb());
    this.onEditorReadyCallbacks = [];

    console.info('[WAA] Editor observer started');
  }

  /**
   * 停止监听编辑器
   */
  stopWatch(): void {
    this.observer?.disconnect();
    this.observer = null;
    this.editorReady = false;

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    console.info('[WAA] Editor observer stopped');
  }

  /**
   * 注册编辑器就绪回调
   */
  onEditorReady(callback: () => void): void {
    if (this.editorReady) {
      callback();
    } else {
      this.onEditorReadyCallbacks.push(callback);
    }
  }

  /**
   * 注册内容变更回调
   */
  onContentChange(callback: () => void): void {
    this.onContentChangeCallbacks.push(callback);
  }

  /**
   * 移除内容变更回调
   */
  offContentChange(callback: () => void): void {
    this.onContentChangeCallbacks =
      this.onContentChangeCallbacks.filter((cb) => cb !== callback);
  }

  /**
   * 获取编辑器是否就绪
   */
  isReady(): boolean {
    return this.editorReady;
  }

  /**
   * 通知内容变更（带防抖）
   */
  private notifyContentChange(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.onContentChangeCallbacks.forEach((cb) => cb());
    }, this.debounceMs);
  }

  /**
   * 查找编辑器元素
   * 使用 WX_SELECTORS 中增强的选择器列表，兼容 UEditor 多种 DOM 结构
   */
  private findEditor(): HTMLElement | null {
    for (const selector of WX_SELECTORS.editorBody) {
      const el = document.querySelector<HTMLElement>(selector);
      if (el) return el;
    }
    return null;
  }
}
