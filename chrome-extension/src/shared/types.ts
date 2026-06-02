// AI 模式
export type AIMode = 'openai' | 'ollama' | 'custom' | 'mock';

// 消息类型枚举
export enum MessageType {
  PING = 'PING',
  PONG = 'PONG',
  ERROR = 'ERROR',
  AI_WRITING_START = 'AI_WRITING_START',
  AI_WRITING_CHUNK = 'AI_WRITING_CHUNK',
  AI_WRITING_DONE = 'AI_WRITING_DONE',
  AI_TITLE_OPTIMIZE = 'AI_TITLE_OPTIMIZE',
  AI_FORMATTING = 'AI_FORMATTING',
  AI_FORMATTING_PREVIEW = 'AI_FORMATTING_PREVIEW',
  AI_DIAGNOSIS_START = 'AI_DIAGNOSIS_START',
  AI_DIAGNOSIS_CHUNK = 'AI_DIAGNOSIS_CHUNK',
  AI_DIAGNOSIS_DONE = 'AI_DIAGNOSIS_DONE',
  AI_VIOLATION_CHECK = 'AI_VIOLATION_CHECK',
  AI_CONFIG_UPDATE = 'AI_CONFIG_UPDATE',
  EDITOR_INSERT = 'EDITOR_INSERT',
  EDITOR_GET_CONTENT = 'EDITOR_GET_CONTENT',
  EDITOR_SET_CONTENT = 'EDITOR_SET_CONTENT',
  EDITOR_GET_TITLE = 'EDITOR_GET_TITLE',
  EDITOR_SET_TITLE = 'EDITOR_SET_TITLE',
  SERVER_HEALTH_CHECK = 'SERVER_HEALTH_CHECK',
  WECHAT_AUTH_START = 'WECHAT_AUTH_START',
  WECHAT_AUTH_LIST = 'WECHAT_AUTH_LIST',
  WECHAT_AUTH_OPEN = 'WECHAT_AUTH_OPEN',
}

// 消息来源
export type MessageSource = 'popup' | 'side-panel' | 'content-script' | 'background';

// 扩展内部消息
export interface ExtMessage {
  type: MessageType;
  source: MessageSource;
  target?: MessageSource;
  payload?: any;
  requestId?: string;
  timestamp: number;
}

// API 响应
export interface ApiResponse<T = any> {
  code: number;
  data: T;
  message: string;
}

// SSE 流式 chunk
export interface SSEChunk {
  chunk: string;
  done: boolean;
  error?: string;
}

// 文章数据
export interface ArticleData {
  title: string;
  url: string;
  publishTime: string;
  readCount: number;
  likeCount: number;
  shareCount: number;
  commentCount: number;
}

// 标题分析
export interface TitleAnalysis {
  score: number;
  originalTitle: string;
  suggestedTitles: SuggestedTitle[];
  analysis: string;
}

export interface SuggestedTitle {
  title: string;
  reason: string;
}

// 违规检测结果
export interface ViolationResult {
  hasViolation: boolean;
  items: ViolationItem[];
  riskLevel: 'low' | 'medium' | 'high';
  suggestions: string[];
}

export interface ViolationItem {
  text: string;
  type: string;
  position: number;
  reason: string;
}

// 诊断建议
export interface DiagnosisSuggestion {
  category: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
}

// 诊断报告
export interface DiagnosisReport {
  articleCount: number;
  avgReadCount: number;
  topArticles: ArticleData[];
  suggestions: DiagnosisSuggestion[];
}

// 模板
export interface Template {
  id: string;
  userId: string;
  name: string;
  category: string;
  styleHtml: string;
  styleCss: string;
  preview: string;
  createdAt: string;
}

// 用户
export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  aiMode: AIMode;
  openaiApiKey: string;
  openaiBaseUrl: string;
  ollamaBaseUrl: string;
  ollamaModel: string;
  createdAt: string;
  updatedAt: string;
}

// 写作模式
export type WritingMode = 'long' | 'short';

// 排版风格
export type FormattingStyle = 'elegant' | 'tech' | 'minimal';

// AI 配置
export interface AIConfig {
  mode: AIMode;
  openaiApiKey: string;
  openaiBaseUrl: string;
  openaiModel: string;
  ollamaBaseUrl: string;
  ollamaModel: string;
  // 自定义 OpenAI 兼容 API（DeepSeek、智谱、Moonshot 等）
  customApiKey: string;
  customBaseUrl: string;
  customModel: string;
}
