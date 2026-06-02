import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Snackbar,
  Alert,
} from '@mui/material';
import { useEditorContent } from '../hooks/use-editor-content';
import { sanitizeHtml } from '../../shared/sanitize';
import { WritingMode } from '../../shared/types';

/** 写作风格选项 */
const WRITING_STYLES = [
  { value: 'formal', label: '正式' },
  { value: 'casual', label: '轻松' },
  { value: 'humorous', label: '幽默' },
  { value: 'academic', label: '学术' },
];

/** 文章长度选项 */
const ARTICLE_LENGTHS = [
  { value: '500', label: '500字' },
  { value: '1000', label: '1000字' },
  { value: '2000', label: '2000字' },
  { value: '3000', label: '3000字' },
];

/** 写作类型选项（短文模式下的扩展选项，对标壹伴AI短文生成） */
const WRITING_TYPES = [
  { value: 'generate', label: '生成', description: '根据主题生成全新文章' },
  { value: 'expand', label: '扩写', description: '对已有内容进行扩展充实' },
  { value: 'rewrite', label: '改写', description: '换一种表达方式重写内容' },
  { value: 'continue', label: '续写', description: '继续撰写已有内容的后续' },
  { value: 'summary', label: '摘要', description: '提炼文章核心要点摘要' },
  { value: 'outline', label: '大纲', description: '生成文章结构大纲' },
];

/** Loading 跳动点动画组件 */
const BouncingDots: React.FC = () => (
  <Box
    component="span"
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '3px',
      ml: 1,
    }}
  >
    {[0, 1, 2].map((i) => (
      <Box
        key={i}
        component="span"
        sx={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          bgcolor: '#1677ff',
          animation: 'waa-bounce 1.4s infinite ease-in-out both',
          animationDelay: `${i * 0.16}s`,
          '@keyframes waa-bounce': {
            '0%, 80%, 100%': { transform: 'scale(0)' },
            '40%': { transform: 'scale(1)' },
          },
        }}
      />
    ))}
  </Box>
);

/**
 * 将流式输出的 Markdown 格式简单转换为 HTML
 * 用于在输出区渲染格式化内容
 */
function renderStreamMarkdown(text: string): string {
  let html = text;
  // 标题转换: ## heading → <h3>
  html = html.replace(/^### (.+)$/gm, '<h4 style="margin:8px 0 4px;font-size:14px;font-weight:600">$1</h4>');
  html = html.replace(/^## (.+)$/gm, '<h3 style="margin:10px 0 6px;font-size:15px;font-weight:700">$1</h3>');
  html = html.replace(/^# (.+)$/gm, '<h2 style="margin:12px 0 8px;font-size:16px;font-weight:700">$1</h2>');
  // 粗体: **bold** → <strong>
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // 斜体: *italic* → <em>（排除已被粗体匹配的）
  html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  // 行内代码: `code` → <code>
  html = html.replace(/`(.+?)`/g, '<code style="background:#f0f0f0;padding:1px 4px;border-radius:3px;font-size:12px">$1</code>');
  // 列表项: - item 或 * item → • item
  html = html.replace(/^[\-\*] (.+)$/gm, '<div style="padding-left:12px">• $1</div>');
  // 有序列表: 1. item
  html = html.replace(/^(\d+)\. (.+)$/gm, '<div style="padding-left:12px">$1. $2</div>');
  // 段落: 双换行分段
  html = html.replace(/\n\n/g, '</p><p style="margin:6px 0">');
  // 单换行: → <br>
  html = html.replace(/\n/g, '<br>');
  return html;
}

export const WritingPanel: React.FC = () => {
  /** 写作参数 */
  const [mode, setMode] = useState<WritingMode>('long');
  const [writingType, setWritingType] = useState('generate');
  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState('formal');
  const [length, setLength] = useState('1000');

  /** 流式输出状态（通过 Port 长连接） */
  const [streamContent, setStreamContent] = useState('');
  const [streamError, setStreamError] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);

  /** 复制/插入反馈 */
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  /** 编辑器操作 Hook */
  const { insertContent } = useEditorContent();

  /** 输出区域自动滚动 */
  const outputRef = useRef<HTMLDivElement>(null);

  /** 使用 ref 追踪 streaming 状态，防止闭包问题 */
  const streamingRef = useRef(false);

  /** 使用 ref 保存 port 引用，以便停止时断开连接 */
  const portRef = useRef<chrome.runtime.Port | null>(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [streamContent]);

  /** 获取写作类型的 prompt 前缀 */
  const getWritingTypePrompt = useCallback((): string => {
    if (mode === 'long') return '';
    const typeMap: Record<string, string> = {
      generate: '请根据以下主题生成一篇文章',
      expand: '请对以下内容进行扩写，丰富细节和论述',
      rewrite: '请改写以下内容，换一种表达方式',
      continue: '请续写以下内容',
      summary: '请提炼以下内容的摘要',
      outline: '请为以下主题生成文章大纲',
    };
    return typeMap[writingType] || '';
  }, [mode, writingType]);

  /** 开始写作 */
  const handleStart = useCallback(() => {
    if (!topic.trim()) {
      setSnackbar({
        open: true,
        message: '请输入文章主题',
        severity: 'error',
      });
      return;
    }

    setStreamContent('');
    setStreamError(null);
    setStreaming(true);
    streamingRef.current = true;

    // 断开上一次未关闭的连接
    if (portRef.current) {
      portRef.current.disconnect();
      portRef.current = null;
    }

    const port = chrome.runtime.connect({ name: 'waa-side-panel' });
    portRef.current = port;
    port.postMessage({
      type: 'AI_WRITING_START',
      source: 'side-panel',
      payload: {
        topic,
        mode,
        style,
        length,
        writingType: mode === 'short' ? writingType : undefined,
        writingTypePrompt: getWritingTypePrompt(),
      },
      requestId: crypto.randomUUID(),
      timestamp: Date.now(),
    });

    port.onMessage.addListener((msg: any) => {
      if (msg.type === 'AI_WRITING_CHUNK' && msg.payload?.chunk) {
        setStreamContent((prev) => prev + msg.payload.chunk);
      } else if (msg.type === 'AI_WRITING_DONE') {
        if (msg.payload?.chunk) {
          setStreamContent((prev) => prev + msg.payload.chunk);
        }
        setStreaming(false);
        streamingRef.current = false;
        port.disconnect();
      } else if (msg.type === 'ERROR') {
        setStreamError(msg.payload?.error || '生成失败');
        setStreaming(false);
        streamingRef.current = false;
        port.disconnect();
      }
    });

    port.onDisconnect.addListener(() => {
      if (streamingRef.current) {
        setStreaming(false);
        streamingRef.current = false;
      }
    });
  }, [topic, mode, style, length, writingType, getWritingTypePrompt]);

  /** 停止生成 */
  const handleStop = useCallback(() => {
    setStreaming(false);
    streamingRef.current = false;
    portRef.current?.disconnect();
    portRef.current = null;
  }, []);

  /** 插入编辑器 */
  const handleInsert = useCallback(async () => {
    try {
      const rawHtml = `<p>${streamContent.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`;
      const html = sanitizeHtml(rawHtml);
      await insertContent(html);
      setSnackbar({
        open: true,
        message: '已插入编辑器',
        severity: 'success',
      });
    } catch {
      setSnackbar({
        open: true,
        message: '插入失败，请重试',
        severity: 'error',
      });
    }
  }, [streamContent, insertContent]);

  /** 复制内容 */
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(streamContent);
      setSnackbar({
        open: true,
        message: '已复制到剪贴板',
        severity: 'success',
      });
    } catch {
      setSnackbar({
        open: true,
        message: '复制失败',
        severity: 'error',
      });
    }
  }, [streamContent]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* 写作模式切换 */}
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
          写作模式
        </Typography>
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(_, v) => v && setMode(v)}
          size="small"
          fullWidth
        >
          <ToggleButton value="long">长文</ToggleButton>
          <ToggleButton value="short">短文</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* 写作类型选择（仅在短文模式下显示，对标壹伴AI短文生成） */}
      {mode === 'short' && (
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
            写作类型
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {WRITING_TYPES.map((t) => (
              <Button
                key={t.value}
                size="small"
                variant={writingType === t.value ? 'contained' : 'outlined'}
                onClick={() => setWritingType(t.value)}
                sx={{
                  fontSize: '12px',
                  minWidth: 'auto',
                  px: 1.2,
                  py: 0.3,
                  borderRadius: '16px',
                  textTransform: 'none',
                }}
                disabled={streaming}
              >
                {t.label}
              </Button>
            ))}
          </Box>
          {WRITING_TYPES.find((t) => t.value === writingType) && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontSize: '11px' }}>
              {WRITING_TYPES.find((t) => t.value === writingType)!.description}
            </Typography>
          )}
        </Box>
      )}

      {/* 主题输入 */}
      <TextField
        multiline
        minRows={2}
        maxRows={4}
        placeholder="输入文章主题或关键词..."
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        size="small"
        fullWidth
        disabled={streaming}
      />

      {/* 选项区 */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <FormControl size="small" fullWidth>
          <InputLabel>写作风格</InputLabel>
          <Select
            value={style}
            label="写作风格"
            onChange={(e) => setStyle(e.target.value)}
            disabled={streaming}
          >
            {WRITING_STYLES.map((s) => (
              <MenuItem key={s.value} value={s.value}>
                {s.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" fullWidth>
          <InputLabel>文章长度</InputLabel>
          <Select
            value={length}
            label="文章长度"
            onChange={(e) => setLength(e.target.value)}
            disabled={streaming}
          >
            {ARTICLE_LENGTHS.map((l) => (
              <MenuItem key={l.value} value={l.value}>
                {l.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* 操作按钮 */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        {streaming ? (
          <Button
            variant="contained"
            color="error"
            size="small"
            onClick={handleStop}
          >
            停止生成
          </Button>
        ) : (
          <Button
            variant="contained"
            size="small"
            onClick={handleStart}
            disabled={!topic.trim()}
          >
            开始写作
          </Button>
        )}

        {streamContent && !streaming && (
          <>
            <Button
              variant="outlined"
              size="small"
              onClick={handleInsert}
            >
              插入编辑器
            </Button>
            <Button variant="outlined" size="small" onClick={handleCopy}>
              复制
            </Button>
          </>
        )}
      </Box>

      {/* 输出区（优化流式 Markdown 渲染） */}
      {(streamContent || streaming || streamError) && (
        <Box
          ref={outputRef}
          sx={{
            bgcolor: '#fafafa',
            border: '1px solid #e8e8e8',
            borderRadius: 1,
            p: 2,
            minHeight: 120,
            maxHeight: 400,
            overflow: 'auto',
            fontSize: '14px',
            lineHeight: 1.7,
            wordBreak: 'break-word',
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            '& h2': { margin: '12px 0 8px', fontSize: '16px', fontWeight: 700 },
            '& h3': { margin: '10px 0 6px', fontSize: '15px', fontWeight: 700 },
            '& h4': { margin: '8px 0 4px', fontSize: '14px', fontWeight: 600 },
            '& strong': { fontWeight: 600 },
            '& em': { fontStyle: 'italic' },
            '& code': {
              background: '#f0f0f0',
              padding: '1px 4px',
              borderRadius: '3px',
              fontSize: '12px',
            },
          }}
          dangerouslySetInnerHTML={{
            __html: streamContent
              ? renderStreamMarkdown(streamContent)
              : '',
          }}
        />
      )}

      {/* 流式输出时的跳动点 */}
      {streaming && !streamContent && <BouncingDots />}

      {/* 错误提示 */}
      {streamError && (
        <Alert severity="error" sx={{ fontSize: '12px' }}>
          {streamError}
        </Alert>
      )}

      {/* Snackbar 反馈 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          sx={{ fontSize: '12px' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
