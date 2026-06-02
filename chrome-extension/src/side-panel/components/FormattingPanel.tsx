import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Snackbar,
  Chip,
} from '@mui/material';
import { AutoFixHigh as AutoFixIcon } from '@mui/icons-material';
import { useEditorContent } from '../hooks/use-editor-content';
import { useMessage } from '../hooks/use-message';
import { MessageType, FormattingStyle } from '../../shared/types';
import { sanitizeHtml } from '../../shared/sanitize';

/** 排版风格配置 */
const FORMATTING_STYLES_CONFIG: Record<
  FormattingStyle,
  { name: string; desc: string; color: string; bgColor: string; borderStyle: string }
> = {
  elegant: {
    name: '优雅风格',
    desc: '深色标题 + 暖色引用框 + 圆角图片 + 衬线体标题',
    color: '#8B4513',
    bgColor: '#FFF8F0',
    borderStyle: 'rounded',
  },
  tech: {
    name: '科技风格',
    desc: '蓝色标题 + 代码块风格引用 + 棱角分明 + 无衬线体',
    color: '#1677ff',
    bgColor: '#F0F5FF',
    borderStyle: 'sharp',
  },
  minimal: {
    name: '极简风格',
    desc: '细线分隔 + 大量留白 + 黑白配色 + 极细字重',
    color: '#333333',
    bgColor: '#FAFAFA',
    borderStyle: 'thin',
  },
};

/**
 * 一键排版：直接在客户端对全文内容应用排版风格
 * 不依赖后端 AI，基于预设规则对 HTML 进行格式化处理
 */
function applyFormattingToHtml(html: string, styleName: FormattingStyle): string {
  if (!html) return html;

  const styleConfig = FORMATTING_STYLES_CONFIG[styleName];
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  // 处理段落 <p>
  const paragraphs = tempDiv.querySelectorAll<HTMLElement>('p');
  paragraphs.forEach((p) => {
    // 移除已有的行内样式，避免冲突
    p.removeAttribute('style');
    switch (styleName) {
      case 'elegant':
        p.style.textIndent = '2em';
        p.style.lineHeight = '1.8';
        p.style.fontSize = '15px';
        p.style.color = '#333';
        p.style.marginBottom = '10px';
        p.style.letterSpacing = '0.5px';
        break;
      case 'tech':
        p.style.lineHeight = '1.75';
        p.style.fontSize = '14px';
        p.style.color = '#2c3e50';
        p.style.marginBottom = '8px';
        p.style.letterSpacing = '0.3px';
        break;
      case 'minimal':
        p.style.lineHeight = '2';
        p.style.fontSize = '15px';
        p.style.color = '#333';
        p.style.marginBottom = '16px';
        p.style.letterSpacing = '1px';
        break;
    }
  });

  // 处理标题 <h1>-<h6>
  const headings = tempDiv.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6');
  headings.forEach((h) => {
    h.removeAttribute('style');
    switch (styleName) {
      case 'elegant':
        h.style.color = styleConfig.color;
        h.style.fontWeight = '700';
        h.style.borderBottom = '2px solid #8B4513';
        h.style.paddingBottom = '6px';
        h.style.marginTop = '20px';
        h.style.marginBottom = '12px';
        break;
      case 'tech':
        h.style.color = styleConfig.color;
        h.style.fontWeight = '700';
        h.style.borderLeft = '4px solid #1677ff';
        h.style.paddingLeft = '10px';
        h.style.marginTop = '18px';
        h.style.marginBottom = '10px';
        break;
      case 'minimal':
        h.style.color = styleConfig.color;
        h.style.fontWeight = '400';
        h.style.letterSpacing = '2px';
        h.style.marginTop = '24px';
        h.style.marginBottom = '12px';
        break;
    }
  });

  // 处理引用 <blockquote>
  const blockquotes = tempDiv.querySelectorAll<HTMLElement>('blockquote');
  blockquotes.forEach((bq) => {
    bq.removeAttribute('style');
    switch (styleName) {
      case 'elegant':
        bq.style.borderLeft = '3px solid #8B4513';
        bq.style.background = '#FFF8F0';
        bq.style.padding = '12px 16px';
        bq.style.borderRadius = '0 8px 8px 0';
        bq.style.margin = '16px 0';
        break;
      case 'tech':
        bq.style.borderLeft = '3px solid #1677ff';
        bq.style.background = '#F0F5FF';
        bq.style.padding = '12px 16px';
        bq.style.fontFamily = 'monospace';
        bq.style.margin = '16px 0';
        break;
      case 'minimal':
        bq.style.borderLeft = '1px solid #999';
        bq.style.padding = '8px 16px';
        bq.style.color = '#666';
        bq.style.margin = '16px 0';
        break;
    }
  });

  // 处理图片 <img>
  const images = tempDiv.querySelectorAll<HTMLImageElement>('img');
  images.forEach((img) => {
    switch (styleName) {
      case 'elegant':
        img.style.borderRadius = '8px';
        img.style.margin = '12px auto';
        img.style.display = 'block';
        img.style.maxWidth = '100%';
        break;
      case 'tech':
        img.style.borderRadius = '0';
        img.style.margin = '12px auto';
        img.style.display = 'block';
        img.style.maxWidth = '100%';
        break;
      case 'minimal':
        img.style.borderRadius = '2px';
        img.style.margin = '16px auto';
        img.style.display = 'block';
        img.style.maxWidth = '100%';
        break;
    }
  });

  return tempDiv.innerHTML;
}

export const FormattingPanel: React.FC = () => {
  const { getContent, setContent } = useEditorContent();
  const { sendToBackground } = useMessage();

  const [selectedStyle, setSelectedStyle] = useState<FormattingStyle>('elegant');
  const [editorContent, setEditorContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  /** 获取编辑器内容 */
  const handleGetContent = useCallback(async () => {
    try {
      const html = await getContent();
      setEditorContent(html);
      setSnackbar({
        open: true,
        message: html ? '已获取编辑器内容' : '编辑器内容为空',
        severity: html ? 'success' : 'error',
      });
    } catch {
      setSnackbar({
        open: true,
        message: '获取内容失败',
        severity: 'error',
      });
    }
  }, [getContent]);

  /** 预览排版 */
  const handlePreview = useCallback(async () => {
    if (!editorContent) {
      setSnackbar({
        open: true,
        message: '请先获取编辑器内容',
        severity: 'error',
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await sendToBackground(MessageType.AI_FORMATTING_PREVIEW, {
        html: editorContent,
        styleName: selectedStyle,
      });

      if (result?.code === 0 && result?.data) {
        setPreviewHtml(result.data.html || result.data.formattedHtml || '');
        setShowPreview(true);
      } else {
        setError(result?.message || '排版预览失败');
      }
    } catch (e: any) {
      setError(e.message || '请求失败');
    } finally {
      setLoading(false);
    }
  }, [editorContent, selectedStyle, sendToBackground]);

  /** 应用排版（AI 排版） */
  const handleApply = useCallback(async () => {
    if (!editorContent) {
      setSnackbar({
        open: true,
        message: '请先获取编辑器内容',
        severity: 'error',
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await sendToBackground(MessageType.AI_FORMATTING, {
        html: editorContent,
        styleName: selectedStyle,
      });

      if (result?.code === 0 && result?.data) {
        const formattedHtml =
          result.data.html || result.data.formattedHtml || '';
        await setContent(formattedHtml);
        setSnackbar({
          open: true,
          message: '排版已应用到编辑器',
          severity: 'success',
        });
        setShowPreview(false);
      } else {
        setError(result?.message || '排版应用失败');
      }
    } catch (e: any) {
      setError(e.message || '请求失败');
    } finally {
      setLoading(false);
    }
  }, [editorContent, selectedStyle, sendToBackground, setContent]);

  /** 一键排版（对标壹伴一键排版）
   *  直接获取全文内容，在客户端应用排版规则，无需后端 AI
   *  适用于快速格式化场景
   */
  const handleOneClickFormatting = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 获取编辑器最新内容
      const html = await getContent();
      if (!html) {
        setSnackbar({
          open: true,
          message: '编辑器内容为空',
          severity: 'error',
        });
        setLoading(false);
        return;
      }

      // 客户端应用排版规则
      const formattedHtml = applyFormattingToHtml(html, selectedStyle);
      await setContent(formattedHtml);

      setEditorContent(formattedHtml);
      setSnackbar({
        open: true,
        message: `一键排版（${FORMATTING_STYLES_CONFIG[selectedStyle].name}）已应用`,
        severity: 'success',
      });
      setShowPreview(false);
    } catch {
      setSnackbar({
        open: true,
        message: '一键排版失败，请重试',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [selectedStyle, getContent, setContent]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* 一键排版按钮（对标壹伴，放在最显眼位置） */}
      <Button
        variant="contained"
        size="medium"
        fullWidth
        onClick={handleOneClickFormatting}
        disabled={loading}
        startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <AutoFixIcon />}
        sx={{
          py: 1.2,
          fontWeight: 600,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%)',
          },
        }}
      >
        一键排版 · {FORMATTING_STYLES_CONFIG[selectedStyle].name}
      </Button>

      {/* 风格选择卡片 */}
      <Typography variant="caption" color="text.secondary">
        选择排版风格
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
        {(Object.entries(FORMATTING_STYLES_CONFIG) as [FormattingStyle, typeof FORMATTING_STYLES_CONFIG[FormattingStyle]][]).map(
          ([key, cfg]) => (
            <Card
              key={key}
              variant="outlined"
              onClick={() => setSelectedStyle(key)}
              sx={{
                cursor: 'pointer',
                borderColor: selectedStyle === key ? cfg.color : '#e8e8e8',
                borderWidth: selectedStyle === key ? 2 : 1,
                bgcolor: cfg.bgColor,
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: cfg.color,
                  boxShadow: `0 0 0 1px ${cfg.color}20`,
                },
              }}
            >
              <CardContent sx={{ py: 1, px: 1.5, '&:last-child': { pb: 1 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: cfg.borderStyle === 'rounded' ? '50%' : cfg.borderStyle === 'sharp' ? 0 : '4px',
                      bgcolor: cfg.color,
                      border: cfg.borderStyle === 'thin' ? '1px solid #999' : 'none',
                    }}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: cfg.color }}>
                    {cfg.name}
                  </Typography>
                  {selectedStyle === key && (
                    <Chip label="已选" size="small" color="primary" sx={{ height: 20, fontSize: '11px' }} />
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {cfg.desc}
                </Typography>
              </CardContent>
            </Card>
          )
        )}
      </Box>

      {/* 操作按钮区 */}
      <Button variant="outlined" size="small" onClick={handleGetContent} fullWidth disabled={loading}>
        获取编辑器内容
      </Button>

      {editorContent && (
        <Typography variant="caption" color="text.secondary">
          已获取内容（{editorContent.length} 字符）
        </Typography>
      )}

      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          variant="contained"
          size="small"
          onClick={handlePreview}
          disabled={!editorContent || loading}
          fullWidth
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : 'AI预览排版'}
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={handleApply}
          disabled={!editorContent || loading}
          fullWidth
        >
          AI应用排版
        </Button>
      </Box>

      {/* 预览区 */}
      {showPreview && previewHtml && (
        <Box
          sx={{
            border: '1px solid #e8e8e8',
            borderRadius: 1,
            p: 1.5,
            maxHeight: 300,
            overflow: 'auto',
            bgcolor: '#fff',
            '& img': { maxWidth: '100%' },
            fontSize: '13px',
          }}
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(previewHtml) }}
        />
      )}

      {/* 错误提示 */}
      {error && (
        <Alert severity="error" sx={{ fontSize: '12px' }}>
          {error}
        </Alert>
      )}

      {/* Snackbar */}
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
