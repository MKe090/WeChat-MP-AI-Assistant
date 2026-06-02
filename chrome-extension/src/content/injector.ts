import { CSS_PREFIX, WX_SELECTORS } from '../shared/constants';

type ResourceSnippet = {
  title: string;
  tag: string;
  html: string;
  preview: string;
};

const RESOURCE_SNIPPETS: ResourceSnippet[] = [
  {
    title: '简单通用标题',
    tag: '标题',
    preview: '简洁蓝色下划线小标题',
    html: '<h2 style="font-size:18px;text-align:center;margin:24px 0 16px;"><span style="display:inline-block;border-bottom:3px solid #5cc9f5;padding:0 14px 5px;color:#202124;">简单通用标题</span></h2>',
  },
  {
    title: '重点内容卡片',
    tag: '正文',
    preview: '适合摘要、观点和核心结论',
    html: '<section style="margin:18px 0;padding:16px 18px;border:1px solid #dceeff;border-left:5px solid #45b7ff;background:#f7fcff;border-radius:6px;"><p style="margin:0;color:#27364a;font-size:15px;line-height:1.9;"><strong style="color:#1677ff;">核心提示：</strong>在这里填写需要读者优先看到的重点内容。</p></section>',
  },
  {
    title: '节日轻量标题',
    tag: '热点',
    preview: '温和活泼的浅色标题条',
    html: '<section style="margin:24px 0 14px;text-align:center;"><span style="display:inline-block;background:#fff7d6;border:1px solid #ffd666;border-radius:999px;padding:6px 18px;color:#7a4b00;font-size:16px;font-weight:700;">今日重点</span></section>',
  },
  {
    title: '科技渐变引言',
    tag: '科技',
    preview: '适合 AI、产品、趋势类文章',
    html: '<section style="margin:18px 0;padding:18px;border-radius:8px;background:linear-gradient(135deg,#101828,#1d4ed8);color:#ffffff;"><p style="margin:0;font-size:16px;line-height:1.9;">把最重要的一句话放在这里，形成开篇抓手。</p></section>',
  },
  {
    title: '金句引用',
    tag: '引用',
    preview: '左侧竖线引用块',
    html: '<blockquote style="margin:18px 0;padding:12px 16px;border-left:4px solid #34c759;background:#f4fff7;color:#344054;font-size:15px;line-height:1.9;">这里是一句适合传播的金句或观点。</blockquote>',
  },
  {
    title: '分割线',
    tag: '组件',
    preview: '轻量图文分隔',
    html: '<p style="text-align:center;margin:26px 0;color:#b8c0cc;font-size:12px;">- - -</p>',
  },
];

/**
 * DOM 注入器：在微信后台页面注入壹伴风格的左侧素材库、右侧工具箱和编辑器增强工具条。
 */
export class Injector {
  private sidePanelContainer: HTMLElement | null = null;
  private toggleBtn: HTMLElement | null = null;
  private emotionStyleContainer: HTMLElement | null = null;
  private resourcePanel: HTMLElement | null = null;
  private panelVisible = true;
  private resourcePanelVisible = true;
  private codeViewActive = false;
  private codeViewTextarea: HTMLTextAreaElement | null = null;
  private editorOriginalDisplay = '';
  private savedSelection: Range | null = null;

  injectSidePanel(): void {
    if (document.getElementById(`${CSS_PREFIX}side-panel-host`)) {
      return;
    }

    const host = document.createElement('div');
    host.id = `${CSS_PREFIX}side-panel-host`;
    host.style.cssText = [
      'position:fixed',
      'right:0',
      'top:0',
      'width:360px',
      'height:100vh',
      'z-index:999999',
      'box-shadow:-6px 0 22px rgba(15,23,42,0.08)',
    ].join(';');

    const shadowRoot = host.attachShadow({ mode: 'open' });

    const styleContainer = document.createElement('style');
    styleContainer.setAttribute('id', 'waa-emotion-cache');
    shadowRoot.appendChild(styleContainer);

    const appContainer = document.createElement('div');
    appContainer.id = 'waa-side-panel-root';
    appContainer.style.cssText = 'width:100%;height:100%;background:#fff;';
    shadowRoot.appendChild(appContainer);

    document.body.appendChild(host);
    this.sidePanelContainer = appContainer;
    this.emotionStyleContainer = styleContainer;

    this.injectToggleBtn();
    this.injectResourcePanel();
    this.listenForPanelToggle();

    console.info('[WAA] Yiban-like side panel injected');
  }

  private injectToggleBtn(): void {
    const toggleBtn = document.createElement('button');
    toggleBtn.id = `${CSS_PREFIX}toggle-btn`;
    toggleBtn.type = 'button';
    toggleBtn.style.cssText = [
      'position:fixed',
      'right:370px',
      'top:16px',
      'width:32px',
      'height:32px',
      'border:none',
      'border-radius:50%',
      'background:#f8fafc',
      'color:#9aa3af',
      'cursor:pointer',
      'z-index:999998',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'font-size:20px',
      'box-shadow:0 2px 10px rgba(15,23,42,0.12)',
    ].join(';');
    toggleBtn.textContent = '›';
    toggleBtn.title = '展开/收起公众号图文工具箱';
    toggleBtn.addEventListener('click', () => this.togglePanel());

    document.body.appendChild(toggleBtn);
    this.toggleBtn = toggleBtn;
  }

  togglePanel(): void {
    const panel = document.getElementById(`${CSS_PREFIX}side-panel-host`);
    if (!panel || !this.toggleBtn) return;

    this.panelVisible = !this.panelVisible;
    panel.style.display = this.panelVisible ? 'block' : 'none';
    this.toggleBtn.style.right = this.panelVisible ? '370px' : '16px';
    this.toggleBtn.textContent = this.panelVisible ? '›' : '‹';
  }

  private listenForPanelToggle(): void {
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type !== 'TOGGLE_SIDE_PANEL') return;

      const shouldShow = message.payload?.visible;
      if (typeof shouldShow === 'boolean') {
        if (shouldShow !== this.panelVisible) this.togglePanel();
      } else {
        this.togglePanel();
      }
    });
  }

  private injectResourcePanel(): void {
    if (document.getElementById(`${CSS_PREFIX}resource-panel`)) {
      return;
    }

    const panel = document.createElement('aside');
    panel.id = `${CSS_PREFIX}resource-panel`;
    panel.style.cssText = [
      'position:fixed',
      'left:0',
      'top:76px',
      'width:430px',
      'height:calc(100vh - 76px)',
      'z-index:999997',
      'background:#fff',
      'border-right:1px solid #e9edf3',
      'box-shadow:8px 0 24px rgba(15,23,42,0.06)',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif',
      'color:#2b2f36',
      'display:flex',
    ].join(';');

    panel.innerHTML = this.renderResourcePanel();
    panel.addEventListener('click', (event) => this.handleResourcePanelClick(event));

    document.body.appendChild(panel);
    this.resourcePanel = panel;
  }

  private renderResourcePanel(): string {
    const categories = ['最新', '热门', '模板', '样式', 'SVG', '背景', '行业', '我的', '更多'];
    const cards = RESOURCE_SNIPPETS.map(
      (snippet, index) => `
        <button class="${CSS_PREFIX}resource-card" data-snippet="${index}" type="button">
          <span class="${CSS_PREFIX}resource-tag">${snippet.tag}</span>
          <strong>${snippet.title}</strong>
          <em>${snippet.preview}</em>
          <span class="${CSS_PREFIX}resource-use">插入</span>
        </button>`
    ).join('');

    return `
      <style>
        #${CSS_PREFIX}resource-panel *{box-sizing:border-box;}
        .${CSS_PREFIX}resource-rail{width:58px;border-right:1px solid #eef1f5;padding:12px 0;background:#fbfcfe;overflow:auto;}
        .${CSS_PREFIX}resource-rail button{width:100%;height:54px;border:0;background:transparent;color:#555;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:3px;}
        .${CSS_PREFIX}resource-rail button:first-child,.${CSS_PREFIX}resource-rail button:hover{color:#1fbf61;font-weight:700;}
        .${CSS_PREFIX}resource-main{flex:1;min-width:0;padding:16px 14px;overflow:auto;}
        .${CSS_PREFIX}resource-tabs{display:flex;gap:8px;margin-bottom:14px;border-bottom:1px solid #f0f2f5;}
        .${CSS_PREFIX}resource-tabs button{border:0;background:#fff;color:#4b5563;font-size:15px;font-weight:700;padding:0 8px 12px;cursor:pointer;}
        .${CSS_PREFIX}resource-tabs button:first-child{color:#22c55e;border-bottom:3px solid #22c55e;}
        .${CSS_PREFIX}resource-search{height:42px;border:1px solid #eef1f5;border-radius:8px;background:#fafafa;color:#9ca3af;display:flex;align-items:center;padding:0 14px;margin-bottom:12px;font-size:14px;}
        .${CSS_PREFIX}resource-meta{text-align:center;color:#99a1af;font-size:13px;margin:10px 0 16px;}
        .${CSS_PREFIX}resource-meta strong{color:#22c55e;}
        .${CSS_PREFIX}resource-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
        .${CSS_PREFIX}resource-card{position:relative;min-height:112px;border:1px solid #e8f2ff;background:#fff;border-radius:8px;padding:13px;text-align:left;cursor:pointer;box-shadow:0 2px 8px rgba(15,23,42,0.04);overflow:hidden;}
        .${CSS_PREFIX}resource-card:hover{border-color:#65c9ff;box-shadow:0 8px 18px rgba(45,156,219,0.14);}
        .${CSS_PREFIX}resource-card strong{display:block;font-size:14px;color:#1f2937;margin:18px 0 8px;}
        .${CSS_PREFIX}resource-card em{display:block;font-style:normal;font-size:12px;line-height:1.55;color:#6b7280;}
        .${CSS_PREFIX}resource-tag{position:absolute;left:10px;top:8px;font-size:11px;color:#22c55e;background:#eafff0;border-radius:999px;padding:2px 7px;}
        .${CSS_PREFIX}resource-use{position:absolute;right:10px;bottom:8px;font-size:12px;color:#1677ff;}
        .${CSS_PREFIX}resource-collapse{position:absolute;right:-18px;top:45%;width:18px;height:72px;border:1px solid #e5e7eb;border-left:0;background:#fff;border-radius:0 8px 8px 0;color:#9ca3af;cursor:pointer;}
        .${CSS_PREFIX}resource-panel-hidden{transform:translateX(-430px);}
      </style>
      <nav class="${CSS_PREFIX}resource-rail">
        ${categories.map((item) => `<button type="button" data-category="${item}"><span>${item}</span></button>`).join('')}
      </nav>
      <section class="${CSS_PREFIX}resource-main">
        <div class="${CSS_PREFIX}resource-tabs">
          <button type="button">排版</button>
          <button type="button">MD</button>
          <button type="button">写作</button>
          <button type="button">配图</button>
          <button type="button">工具</button>
        </div>
        <div class="${CSS_PREFIX}resource-search">搜索样式关键词</div>
        <div class="${CSS_PREFIX}resource-meta">近期更新了 <strong>298</strong> 个本地样式</div>
        <div class="${CSS_PREFIX}resource-grid">${cards}</div>
      </section>
      <button class="${CSS_PREFIX}resource-collapse" type="button" data-collapse-resource>Ⅱ</button>
    `;
  }

  private handleResourcePanelClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const collapseBtn = target.closest<HTMLElement>('[data-collapse-resource]');
    if (collapseBtn && this.resourcePanel) {
      this.resourcePanelVisible = !this.resourcePanelVisible;
      this.resourcePanel.style.transform = this.resourcePanelVisible
        ? 'translateX(0)'
        : 'translateX(-430px)';
      this.resourcePanel.style.transition = 'transform 0.2s ease';
      return;
    }

    const card = target.closest<HTMLElement>('[data-snippet]');
    if (!card) return;

    const index = Number(card.dataset.snippet);
    const snippet = RESOURCE_SNIPPETS[index];
    if (snippet) {
      this.insertHtml(snippet.html);
    }
  }

  injectToolbar(): void {
    const toolbarRow = this.findNativeToolbar();
    if (!toolbarRow) {
      console.warn('[WAA] Native editor toolbar not found, will retry');
      setTimeout(() => this.injectToolbar(), 1000);
      return;
    }

    if (toolbarRow.querySelector(`.${CSS_PREFIX}toolbar-group`)) {
      return;
    }

    const separator = document.createElement('span');
    separator.className = `${CSS_PREFIX}toolbar-separator`;
    separator.style.cssText = 'margin:0 6px;width:1px;height:22px;background:#e5e7eb;display:inline-block;vertical-align:middle;';

    const btnGroup = document.createElement('span');
    btnGroup.className = `${CSS_PREFIX}toolbar-group`;
    btnGroup.style.cssText = [
      'display:inline-flex',
      'align-items:center',
      'gap:3px',
      'padding:4px 8px',
      'margin-left:4px',
      'background:#fff',
      'border:1px solid #eef1f5',
      'border-radius:4px',
      'vertical-align:middle',
    ].join(';');

    const buttons: { action: string; label: string; title: string; wide?: boolean }[] = [
      { action: 'superscript', label: 'X²', title: '上标' },
      { action: 'subscript', label: 'X₂', title: '下标' },
      { action: 'letter-space', label: 'AV', title: '字间距' },
      { action: 'accent', label: '✦', title: '强调样式' },
      { action: 'image-center', label: '▧', title: '图片居中' },
      { action: 'emoji', label: '☺', title: '插入表情' },
      { action: 'search', label: '⌕', title: '搜索' },
      { action: 'code-view', label: 'HTML', title: '编辑源代码', wide: true },
      { action: 'clipboard', label: '▣', title: '粘贴剪贴板 HTML' },
      { action: 'full-emphasis', label: '全文强调', title: '插入全文强调块', wide: true },
      { action: 'one-click-format', label: '一键排版', title: '插入一键排版样式', wide: true },
      { action: 'underline-mark', label: '重点划线', title: '重点划线', wide: true },
      { action: 'image-design', label: '图片设计', title: '图片设计提示块', wide: true },
      { action: 'ai-format', label: 'AI排版', title: '打开 AI 排版工具', wide: true },
      { action: 'auto-format', label: '自动排版', title: '自动排版', wide: true },
    ];

    for (const btn of buttons) {
      btnGroup.appendChild(this.createToolbarButton(btn.action, btn.label, btn.title, btn.wide));
    }

    toolbarRow.appendChild(separator);
    toolbarRow.appendChild(btnGroup);

    console.info('[WAA] Yiban-like editor toolbar injected');
  }

  private createToolbarButton(action: string, label: string, title: string, wide = false): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = `${CSS_PREFIX}toolbar-btn`;
    btn.dataset.action = action;
    btn.type = 'button';
    btn.title = title;
    btn.style.cssText = [
      'display:inline-flex',
      'align-items:center',
      'justify-content:center',
      wide ? 'min-width:58px' : 'width:28px',
      'height:28px',
      'padding:0 7px',
      'border:none',
      'border-radius:3px',
      'background:transparent',
      'cursor:pointer',
      'font-size:12px',
      'color:#3f4652',
      'white-space:nowrap',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif',
    ].join(';');
    btn.textContent = label;

    btn.addEventListener('mouseenter', () => {
      btn.style.background = '#eaf8f0';
      btn.style.color = '#16a34a';
    });
    btn.addEventListener('mouseleave', () => {
      if (action !== 'code-view' || !this.codeViewActive) {
        btn.style.background = 'transparent';
        btn.style.color = '#3f4652';
      }
    });
    btn.addEventListener('mousedown', (event) => {
      event.preventDefault();
      this.saveSelection();
    });
    btn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.handleToolbarAction(action);
    });

    return btn;
  }

  private findNativeToolbar(): HTMLElement | null {
    for (const selector of WX_SELECTORS.editorToolbar) {
      const el = document.querySelector<HTMLElement>(selector);
      if (el) return el;
    }
    return null;
  }

  private handleToolbarAction(action: string): void {
    if (this.codeViewActive && action !== 'code-view') {
      this.toggleCodeView();
    }

    this.restoreSelection();

    switch (action) {
      case 'code-view':
        this.toggleCodeView();
        break;
      case 'superscript':
      case 'subscript':
      case 'bold':
      case 'italic':
        this.execInlineCommand(action);
        break;
      case 'letter-space':
        this.insertHtml('<span style="letter-spacing:2px;">字间距文字</span>');
        break;
      case 'accent':
      case 'full-emphasis':
        this.insertHtml('<span style="background:#fff2cc;color:#7a4b00;padding:2px 4px;border-radius:3px;font-weight:700;">重点内容</span>');
        break;
      case 'image-center':
        this.centerSelectedImage();
        break;
      case 'emoji':
        this.insertHtml('😊');
        break;
      case 'search':
        window.open('https://weixin.sogou.com/', '_blank', 'noopener,noreferrer');
        break;
      case 'clipboard':
        void this.insertClipboardText();
        break;
      case 'one-click-format':
      case 'auto-format':
        this.insertHtml('<section style="margin:18px 0;padding:16px;border-radius:8px;background:#f7fbff;border:1px solid #dbeafe;"><p style="margin:0;font-size:15px;line-height:1.9;color:#243b53;">已插入一键排版示例块，可在右侧继续使用 AI 排版生成完整样式。</p></section>');
        break;
      case 'underline-mark':
        this.insertHtml('<span style="background:linear-gradient(transparent 58%,#b8f7d0 58%);font-weight:700;">重点划线文字</span>');
        break;
      case 'image-design':
        this.insertHtml('<section style="margin:18px 0;padding:14px;border:1px dashed #93c5fd;border-radius:6px;color:#2563eb;background:#eff6ff;">图片设计：在这里放置配图说明或封面提示。</section>');
        break;
      case 'ai-format':
        this.openSidePanelTab('formatting');
        break;
    }
  }

  private execInlineCommand(action: string): void {
    const editor = this.findEditorArea();
    if (!editor) return;

    const ueEditor = this.getUEditorInstance();
    const command = action === 'superscript'
      ? 'superscript'
      : action === 'subscript'
        ? 'subscript'
        : action;

    if (ueEditor) {
      ueEditor.focus();
      ueEditor.execCommand(command);
    } else {
      editor.focus();
      document.execCommand(command);
    }

    editor.dispatchEvent(new Event('input', { bubbles: true }));
  }

  private insertHtml(html: string): void {
    const editor = this.findEditorArea();
    if (!editor) return;

    this.restoreSelection();
    const ueEditor = this.getUEditorInstance();
    if (ueEditor) {
      ueEditor.focus();
      ueEditor.execCommand('insertHtml', html);
    } else {
      editor.focus();
      document.execCommand('insertHTML', false, html);
    }
    editor.dispatchEvent(new Event('input', { bubbles: true }));
  }

  private async insertClipboardText(): Promise<void> {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        this.insertHtml(text);
      }
    } catch {
      this.insertHtml('<p style="color:#999;">剪贴板读取失败，请手动粘贴。</p>');
    }
  }

  private openSidePanelTab(tab: string): void {
    if (!this.panelVisible) this.togglePanel();
    window.postMessage({ type: 'WAA_OPEN_TAB', tab }, '*');
  }

  private toggleCodeView(): void {
    const editor = this.findEditorArea();
    if (!editor) return;

    const editorContainer = this.findEditorContainer();

    if (!this.codeViewActive) {
      const html = editor.innerHTML;
      this.editorOriginalDisplay = editor.style.display || '';

      const codeViewPanel = document.createElement('div');
      codeViewPanel.className = `${CSS_PREFIX}code-view-panel`;
      codeViewPanel.style.cssText = 'border:1px solid #e8e8e8;border-radius:4px;background:#fff;margin:0;padding:0;';

      const tipBar = document.createElement('div');
      tipBar.className = `${CSS_PREFIX}code-view-tip`;
      tipBar.style.cssText = [
        'background:#fff7e6',
        'border-bottom:1px solid #ffd591',
        'padding:6px 12px',
        'font-size:12px',
        'color:#d48806',
        'display:flex',
        'align-items:center',
        'gap:6px',
      ].join(';');
      tipBar.textContent = '代码视图模式：直接编辑 HTML，切换回富文本视图后生效';

      const textarea = document.createElement('textarea');
      textarea.className = `${CSS_PREFIX}code-view-textarea`;
      textarea.value = this.formatHtml(html);
      textarea.style.cssText = [
        'width:100%',
        'min-height:420px',
        'padding:12px',
        'font-family:Consolas,Menlo,monospace',
        'font-size:13px',
        'line-height:1.6',
        'border:none',
        'background:#f8f9fa',
        'resize:vertical',
        'box-sizing:border-box',
        'white-space:pre',
        'tab-size:2',
        'outline:none',
      ].join(';');
      textarea.spellcheck = false;
      textarea.addEventListener('keydown', (event) => {
        if (event.key !== 'Tab') return;
        event.preventDefault();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        textarea.value = `${textarea.value.substring(0, start)}  ${textarea.value.substring(end)}`;
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      });

      codeViewPanel.appendChild(tipBar);
      codeViewPanel.appendChild(textarea);

      if (editorContainer) {
        editorContainer.insertBefore(codeViewPanel, editor.nextSibling);
      } else {
        editor.parentElement?.insertBefore(codeViewPanel, editor.nextSibling);
      }

      editor.style.display = 'none';
      this.codeViewTextarea = textarea;
      this.codeViewActive = true;
      this.updateCodeViewButtonState(true);
      return;
    }

    editor.innerHTML = this.codeViewTextarea?.value || '';
    editor.style.display = this.editorOriginalDisplay || 'block';
    document.querySelector(`.${CSS_PREFIX}code-view-panel`)?.remove();
    this.codeViewTextarea = null;
    this.codeViewActive = false;
    this.updateCodeViewButtonState(false);
    editor.dispatchEvent(new Event('input', { bubbles: true }));
  }

  private updateCodeViewButtonState(active: boolean): void {
    const btns = document.querySelectorAll<HTMLElement>(`.${CSS_PREFIX}toolbar-btn[data-action="code-view"]`);
    btns.forEach((el) => {
      el.style.background = active ? '#22c55e' : 'transparent';
      el.style.color = active ? '#fff' : '#3f4652';
      el.title = active ? '富文本视图' : '编辑源代码';
    });
  }

  private formatHtml(html: string): string {
    let formatted = '';
    let indent = 0;
    const tab = '  ';
    const lines = html
      .replace(/></g, '>\n<')
      .replace(/>/g, '>\n')
      .replace(/</g, '\n<')
      .split('\n')
      .filter((line) => line.trim());

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.match(/^<\/\w/)) indent = Math.max(0, indent - 1);
      formatted += `${tab.repeat(indent)}${trimmed}\n`;
      if (trimmed.match(/^<\w[^>]*[^/]>$/)) indent++;
    }
    return formatted.trim();
  }

  private centerSelectedImage(): void {
    const editor = this.findEditorArea();
    if (!editor) return;

    const selection = window.getSelection();
    const selectedImg = selection?.anchorNode?.parentElement?.closest('img') as HTMLImageElement | null;
    const image = selectedImg || editor.querySelector<HTMLImageElement>('img');
    if (image) {
      image.style.display = 'block';
      image.style.margin = '0 auto';
      editor.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  private saveSelection(): void {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      this.savedSelection = sel.getRangeAt(0).cloneRange();
    }
  }

  private restoreSelection(): void {
    if (!this.savedSelection) return;
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(this.savedSelection);
    }
    this.savedSelection = null;
  }

  private getUEditorInstance(): any | null {
    try {
      const ue = (window as any).UE?.getEditor?.('js_editor');
      if (ue && typeof ue.execCommand === 'function') {
        return ue;
      }
    } catch {
      // UEditor API 不可用时退回 document.execCommand。
    }
    return null;
  }

  private findEditorArea(): HTMLElement | null {
    for (const selector of WX_SELECTORS.editorBody) {
      const el = document.querySelector<HTMLElement>(selector);
      if (el) return el;
    }
    return null;
  }

  private findEditorContainer(): HTMLElement | null {
    for (const selector of WX_SELECTORS.editorContainer) {
      const el = document.querySelector<HTMLElement>(selector);
      if (el) return el;
    }
    return null;
  }

  getSidePanelContainer(): HTMLElement | null {
    return this.sidePanelContainer;
  }

  getEmotionStyleContainer(): HTMLElement | null {
    return this.emotionStyleContainer;
  }
}
