import { WX_SELECTORS } from '../shared/constants';

/**
 * 编辑器适配器：读写微信编辑器内容
 * 支持 UEditor API 桥接，优先使用 UEditor 实例方法
 */
export class EditorAdapter {
  /**
   * 获取 UEditor 实例（如果可用）
   * 微信公众号后台使用 UEditor 作为富文本编辑器，
   * 通过 window.UE 全局对象获取编辑器实例
   */
  private getUEditor(): any {
    const w = window as any;
    if (w.UE?.getEditor) {
      try {
        // 优先使用 js_editor ID，这是微信后台常用的编辑器 ID
        const editor = w.UE.getEditor('js_editor');
        if (editor) return editor;
        // 备选 ID
        const editor2 = w.UE.getEditor('ueditor_0');
        if (editor2) return editor2;
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * 获取编辑器 HTML 内容
   * 优先使用 UEditor API，fallback 到 DOM 读取
   */
  getContent(): string {
    const ue = this.getUEditor();
    if (ue?.getContent) {
      try {
        return ue.getContent();
      } catch {
        // UEditor API 调用失败，fallback
      }
    }
    const editor = this.findEditor();
    return editor?.innerHTML || '';
  }

  /**
   * 设置编辑器 HTML 内容
   * 优先使用 UEditor API，fallback 到 DOM 操作
   */
  setContent(html: string): void {
    const ue = this.getUEditor();
    if (ue?.setContent) {
      try {
        ue.setContent(html);
        return;
      } catch {
        // UEditor API 调用失败，fallback
      }
    }
    // fallback: 直接操作 DOM
    const editor = this.findEditor();
    if (editor) {
      editor.innerHTML = html;
      this.triggerInput(editor);
    } else {
      console.warn('[WAA] Editor not found when setting content');
    }
  }

  /**
   * 获取文章标题
   */
  getTitle(): string {
    const titleEl = this.findTitleInput();
    if (!titleEl) return '';
    if ('value' in titleEl) {
      return (titleEl as HTMLInputElement).value;
    }
    return titleEl.textContent || '';
  }

  /**
   * 设置文章标题
   */
  setTitle(title: string): void {
    const titleEl = this.findTitleInput();
    if (!titleEl) {
      console.warn('[WAA] Title input not found when setting title');
      return;
    }

    if ('value' in titleEl) {
      (titleEl as HTMLInputElement).value = title;
    } else {
      titleEl.textContent = title;
    }
    this.triggerInput(titleEl);
  }

  /**
   * 在光标位置插入 HTML
   * 优先使用 UEditor API，fallback 到 Selection API
   */
  insertAtCursor(html: string): void {
    const ue = this.getUEditor();
    if (ue?.execCommand) {
      try {
        ue.execCommand('inserthtml', html);
        return;
      } catch {
        // UEditor API 调用失败，fallback
      }
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      // 没有选区时追加到编辑器末尾
      const editor = this.findEditor();
      if (editor) {
        editor.insertAdjacentHTML('beforeend', html);
        this.triggerInput(editor);
      }
      return;
    }

    const range = selection.getRangeAt(0);
    range.deleteContents();

    const fragment = range.createContextualFragment(html);
    range.insertNode(fragment);
    range.collapse(false);

    // 触发 input 事件
    const editor = this.findEditor();
    if (editor) {
      this.triggerInput(editor);
    }
  }

  /**
   * 获取编辑器纯文本内容
   */
  getPlainText(): string {
    const ue = this.getUEditor();
    if (ue?.getContentTxt) {
      try {
        return ue.getContentTxt();
      } catch {
        // fallback
      }
    }
    const editor = this.findEditor();
    return editor?.textContent || '';
  }

  /**
   * 判断编辑器是否就绪
   */
  isEditorReady(): boolean {
    // 优先检查 UEditor 实例是否就绪
    const ue = this.getUEditor();
    if (ue && !ue.isHidden?.()) {
      return true;
    }
    return this.findEditor() !== null;
  }

  /**
   * 查找微信编辑器元素（使用增强的选择器列表）
   */
  private findEditor(): HTMLElement | null {
    for (const selector of WX_SELECTORS.editorBody) {
      const el = document.querySelector<HTMLElement>(selector);
      if (el) return el;
    }
    return null;
  }

  /**
   * 查找标题输入框
   */
  private findTitleInput(): HTMLElement | null {
    for (const selector of WX_SELECTORS.titleInput) {
      const el = document.querySelector<HTMLElement>(selector);
      if (el) return el;
    }
    return null;
  }

  /**
   * 触发 input / change 事件，确保微信编辑器感知到内容变化
   */
  private triggerInput(el: HTMLElement): void {
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    // 微信编辑器可能还需要 keyup 事件
    el.dispatchEvent(
      new KeyboardEvent('keyup', { bubbles: true })
    );
  }
}
