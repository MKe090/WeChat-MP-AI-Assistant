// 本地服务地址
export const LOCAL_SERVER_URL = 'http://127.0.0.1:3456';

// CSS 前缀
export const CSS_PREFIX = 'waa-';

// 微信编辑器选择器（容错策略：ID → 属性 → 文本匹配）
export const WX_SELECTORS = {
  editorBody: [
    '#edui1_body_container',       // UEditor 标准 ID
    '#js_editor .edui-body-container',
    '.edui-editor-body',           // UEditor 编辑器 body
    '.edui-body-container',        // UEditor body 容器备选
    '#ueditor_0',                  // UEditor iframe 内编辑区域
    '[contenteditable="true"]',    // 通用 fallback
  ],
  titleInput: ['#title', '.weui-desktop-form__input'],
  publishBtn: ['.weui-desktop-btn_primary'],
  sidePanelAnchor: ['.main_bd', '#js_container'],
  // 微信原生编辑器工具栏（第二行，用于追加 AI 增强按钮）
  editorToolbar: [
    '.edui-editor-toolbarboxinner',   // UEditor 工具栏
    '.edui-toolbar',                  // UEditor 工具栏备选
    '#edui1_toolbarbox',              // UEditor 工具栏 ID
    '.weui-desktop-editor-toolbar__bottom',
    '.editor_toolbar .toolbar_row:last-child',
    '#js_editor_toolbar .editor_toolbar_inner',
    '.edui-toolbar-secondary',
  ],
  // 编辑器外层容器（用于代码视图切换时定位）
  editorContainer: [
    '.weui-desktop-editor',
    '#js_mainArea',
    '.mp_editor_area',
    '.editor_area',
  ],
};

// 排版风格名称
export const FORMATTING_STYLES: Record<string, string> = {
  elegant: '优雅风格',
  tech: '科技风格',
  minimal: '极简风格',
};

// 错误码
export const ERROR_CODES = {
  UNKNOWN: 0,
  MESSAGE_ROUTE_FAILED: 1,
  CONTENT_SCRIPT_NOT_READY: 3,
  EDITOR_DOM_NOT_FOUND: 4,
  // 本地服务
  PARAM_INVALID: 10001,
  AUTH_FAILED: 10002,
  NOT_FOUND: 10003,
  // AI 服务
  AI_REQUEST_FAILED: 20001,
  API_KEY_INVALID: 20002,
  MODEL_UNAVAILABLE: 20003,
  REQUEST_TIMEOUT: 20004,
  CONTENT_FILTERED: 20005,
  // 存储
  DB_ERROR: 30001,
  STORAGE_ERROR: 30002,
};
