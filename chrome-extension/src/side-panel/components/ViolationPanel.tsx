import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  Chip,
  Card,
  CardContent,
  CircularProgress,
  Snackbar,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useEditorContent } from '../hooks/use-editor-content';
import { useMessage } from '../hooks/use-message';
import { MessageType, ViolationResult, ViolationItem } from '../../shared/types';

/** 风险等级配置 */
const RISK_LEVEL_CONFIG = {
  low: { label: '低风险', color: '#52c41a', bgColor: '#f6ffed' },
  medium: { label: '中风险', color: '#fa8c16', bgColor: '#fff7e6' },
  high: { label: '高风险', color: '#ff4d4f', bgColor: '#fff2f0' },
};

export const ViolationPanel: React.FC = () => {
  const { getContent } = useEditorContent();
  const { sendToBackground } = useMessage();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ViolationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [customContent, setCustomContent] = useState('');
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [showCustomWordsDialog, setShowCustomWordsDialog] = useState(false);
  const [customWord, setCustomWord] = useState('');
  const [customWords, setCustomWords] = useState<string[]>([]);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  /** 检测当前文章 */
  const handleCheckArticle = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
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

      const res = await sendToBackground(MessageType.AI_VIOLATION_CHECK, {
        content: html,
      });

      if (res?.code === 0 && res?.data) {
        setResult(res.data as ViolationResult);
      } else {
        setError(res?.message || '检测失败');
      }
    } catch (e: any) {
      setError(e.message || '请求失败');
    } finally {
      setLoading(false);
    }
  }, [getContent, sendToBackground]);

  /** 检测自定义内容 */
  const handleCheckCustom = useCallback(async () => {
    if (!customContent.trim()) {
      setSnackbar({
        open: true,
        message: '请输入内容',
        severity: 'error',
      });
      return;
    }

    setShowCustomDialog(false);
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await sendToBackground(MessageType.AI_VIOLATION_CHECK, {
        content: customContent,
      });

      if (res?.code === 0 && res?.data) {
        setResult(res.data as ViolationResult);
      } else {
        setError(res?.message || '检测失败');
      }
    } catch (e: any) {
      setError(e.message || '请求失败');
    } finally {
      setLoading(false);
    }
  }, [customContent, sendToBackground]);

  /** 添加自定义敏感词 */
  const handleAddCustomWord = useCallback(() => {
    if (customWord.trim() && !customWords.includes(customWord.trim())) {
      setCustomWords((prev) => [...prev, customWord.trim()]);
      setCustomWord('');
    }
  }, [customWord, customWords]);

  /** 删除自定义敏感词 */
  const handleRemoveCustomWord = useCallback((word: string) => {
    setCustomWords((prev) => prev.filter((w) => w !== word));
  }, []);

  const riskConfig = result ? RISK_LEVEL_CONFIG[result.riskLevel] : null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* 操作按钮 */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          variant="contained"
          size="small"
          onClick={handleCheckArticle}
          disabled={loading}
          fullWidth
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : '检测当前文章'}
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={() => setShowCustomDialog(true)}
          disabled={loading}
          fullWidth
        >
          检测自定义内容
        </Button>
      </Box>

      {/* 检测结果 */}
      {result && (
        <>
          {/* 风险等级指示器 */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              py: 2,
              bgcolor: riskConfig?.bgColor,
              borderRadius: 1,
              border: `1px solid ${riskConfig?.color}40`,
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: riskConfig?.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography
                variant="h6"
                sx={{ color: '#fff', fontWeight: 700, fontSize: '18px' }}
              >
                {result.riskLevel === 'low' ? '✓' : result.riskLevel === 'medium' ? '!' : '✗'}
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="subtitle1"
                sx={{ color: riskConfig?.color, fontWeight: 700 }}
              >
                {riskConfig?.label}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                共检测到 {result.items?.length || 0} 个违规项
              </Typography>
            </Box>
          </Box>

          {/* 违规项目列表 */}
          {result.items?.length > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                违规项目
              </Typography>
              {result.items.map((item: ViolationItem, idx: number) => (
                <Card
                  key={idx}
                  variant="outlined"
                  sx={{ mb: 1, borderColor: '#ffe0e0' }}
                >
                  <CardContent sx={{ py: 1, px: 1.5, '&:last-child': { pb: 1 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#ff4d4f' }}>
                        「{item.text}」
                      </Typography>
                      <Chip
                        label={item.type}
                        size="small"
                        color="error"
                        variant="outlined"
                        sx={{ height: 20, fontSize: '11px' }}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {item.reason}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}

          {/* 修改建议列表 */}
          {result.suggestions?.length > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                修改建议
              </Typography>
              {result.suggestions.map((suggestion: string, idx: number) => (
                <Box
                  key={idx}
                  sx={{
                    bgcolor: '#f6ffed',
                    borderRadius: 1,
                    p: 1,
                    mb: 0.5,
                    fontSize: '13px',
                    borderLeft: '3px solid #52c41a',
                  }}
                >
                  {suggestion}
                </Box>
              ))}
            </Box>
          )}

          {/* 无违规提示 */}
          {!result.hasViolation && (
            <Alert severity="success" sx={{ fontSize: '12px' }}>
              未检测到违规内容
            </Alert>
          )}
        </>
      )}

      {/* 错误提示 */}
      {error && (
        <Alert severity="error" sx={{ fontSize: '12px' }}>
          {error}
        </Alert>
      )}

      {/* 自定义敏感词按钮 */}
      <Button
        variant="text"
        size="small"
        onClick={() => setShowCustomWordsDialog(true)}
        sx={{ fontSize: '12px' }}
      >
        自定义敏感词（{customWords.length}）
      </Button>

      {/* 自定义内容检测对话框 */}
      <Dialog
        open={showCustomDialog}
        onClose={() => setShowCustomDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontSize: '16px' }}>检测自定义内容</DialogTitle>
        <DialogContent>
          <TextField
            multiline
            minRows={4}
            maxRows={10}
            placeholder="输入或粘贴要检测的内容..."
            value={customContent}
            onChange={(e) => setCustomContent(e.target.value)}
            fullWidth
            size="small"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCustomDialog(false)}>取消</Button>
          <Button variant="contained" onClick={handleCheckCustom}>
            开始检测
          </Button>
        </DialogActions>
      </Dialog>

      {/* 自定义敏感词对话框 */}
      <Dialog
        open={showCustomWordsDialog}
        onClose={() => setShowCustomWordsDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontSize: '16px' }}>自定义敏感词</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 1, mb: 2, mt: 1 }}>
            <TextField
              placeholder="输入敏感词..."
              value={customWord}
              onChange={(e) => setCustomWord(e.target.value)}
              size="small"
              fullWidth
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddCustomWord();
              }}
            />
            <Button variant="contained" size="small" onClick={handleAddCustomWord}>
              添加
            </Button>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {customWords.length === 0 ? (
              <Typography variant="caption" color="text.secondary">
                暂无自定义敏感词
              </Typography>
            ) : (
              customWords.map((word) => (
                <Chip
                  key={word}
                  label={word}
                  size="small"
                  onDelete={() => handleRemoveCustomWord(word)}
                  color="error"
                  variant="outlined"
                />
              ))
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCustomWordsDialog(false)}>关闭</Button>
        </DialogActions>
      </Dialog>

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
