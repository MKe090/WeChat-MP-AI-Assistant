import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Alert,
} from '@mui/material';
import { useEditorContent } from '../hooks/use-editor-content';
import { sanitizeHtml } from '../../shared/sanitize';

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
          animation: 'waa-bounce-diag 1.4s infinite ease-in-out both',
          animationDelay: `${i * 0.16}s`,
          '@keyframes waa-bounce-diag': {
            '0%, 80%, 100%': { transform: 'scale(0)' },
            '40%': { transform: 'scale(1)' },
          },
        }}
      />
    ))}
  </Box>
);

export const DiagnosisPanel: React.FC = () => {
  const { getContent } = useEditorContent();

  const [content, setContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const outputRef = useRef<HTMLDivElement>(null);
  const streamingRef = useRef(false);
  /** 使用 ref 保存 port 引用，以便停止时断开连接 */
  const portRef = useRef<chrome.runtime.Port | null>(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [content]);

  /** 开始诊断 */
  const handleStartDiagnosis = useCallback(async () => {
    setContent('');
    setError(null);
    setIsStreaming(true);
    streamingRef.current = true;

    // 断开上一次未关闭的连接
    if (portRef.current) {
      portRef.current.disconnect();
      portRef.current = null;
    }

    // 先获取编辑器内容作为文章数据源
    let html = '';
    try {
      html = await getContent();
    } catch {
      // 获取失败时使用默认值
    }

    const port = chrome.runtime.connect({ name: 'waa-side-panel' });
    portRef.current = port;
    port.postMessage({
      type: 'AI_DIAGNOSIS_START',
      source: 'side-panel',
      payload: {
        articles: html || '当前文章',
      },
      requestId: crypto.randomUUID(),
      timestamp: Date.now(),
    });

    port.onMessage.addListener((msg: any) => {
      if (msg.type === 'AI_DIAGNOSIS_CHUNK' && msg.payload?.chunk) {
        setContent((prev) => prev + msg.payload.chunk);
      } else if (msg.type === 'AI_DIAGNOSIS_DONE') {
        if (msg.payload?.chunk) {
          setContent((prev) => prev + msg.payload.chunk);
        }
        setIsStreaming(false);
        streamingRef.current = false;
        portRef.current = null;
        port.disconnect();
      } else if (msg.type === 'ERROR') {
        setError(msg.payload?.error || '诊断失败');
        setIsStreaming(false);
        streamingRef.current = false;
        portRef.current = null;
        port.disconnect();
      }
    });

    port.onDisconnect.addListener(() => {
      if (streamingRef.current) {
        setIsStreaming(false);
        streamingRef.current = false;
        portRef.current = null;
      }
    });
  }, [getContent]);

  /** 停止诊断 */
  const handleStop = useCallback(() => {
    setIsStreaming(false);
    streamingRef.current = false;
    portRef.current?.disconnect();
    portRef.current = null;
  }, []);

  /** 简易 Markdown 渲染（仅支持标题、列表、加粗） */
  const renderMarkdown = (text: string): string => {
    return text
      .replace(/^### (.+)$/gm, '<h4 style="margin:8px 0 4px;font-size:14px;font-weight:600">$1</h4>')
      .replace(/^## (.+)$/gm, '<h3 style="margin:10px 0 4px;font-size:15px;font-weight:600">$1</h3>')
      .replace(/^# (.+)$/gm, '<h2 style="margin:12px 0 4px;font-size:16px;font-weight:700">$1</h2>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/^- (.+)$/gm, '<li style="margin-left:16px;font-size:13px">$1</li>')
      .replace(/^(\d+)\. (.+)$/gm, '<li style="margin-left:16px;font-size:13px">$1. $2</li>')
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* 数据来源说明 */}
      <Alert severity="info" sx={{ fontSize: '12px' }}>
        诊断将基于当前编辑器内容和历史文章数据进行分析
      </Alert>

      {/* 操作按钮 */}
      {isStreaming ? (
        <Button
          variant="contained"
          color="error"
          size="small"
          onClick={handleStop}
          fullWidth
        >
          停止诊断
        </Button>
      ) : (
        <Button
          variant="contained"
          size="small"
          onClick={handleStartDiagnosis}
          fullWidth
        >
          开始诊断
        </Button>
      )}

      {/* 诊断输出区 */}
      {(content || isStreaming) && (
        <Box
          ref={outputRef}
          sx={{
            bgcolor: '#fafafa',
            border: '1px solid #e8e8e8',
            borderRadius: 1,
            p: 2,
            minHeight: 120,
            maxHeight: 500,
            overflow: 'auto',
            fontSize: '13px',
            lineHeight: 1.7,
          }}
        >
          <Box
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(renderMarkdown(content)) }}
            sx={{ '& h2, & h3, & h4': { color: '#1677ff' } }}
            component="div"
          />
          {isStreaming && <BouncingDots />}
        </Box>
      )}

      {/* 错误提示 */}
      {error && (
        <Alert severity="error" sx={{ fontSize: '12px' }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};
