import React, { useState, useCallback } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
  Chip,
  LinearProgress,
} from '@mui/material';
import { ContentCopy as CopyIcon, Star as StarIcon } from '@mui/icons-material';
import { useEditorContent } from '../hooks/use-editor-content';
import { useMessage } from '../hooks/use-message';
import { MessageType, TitleAnalysis, SuggestedTitle } from '../../shared/types';

/** 评分等级配置 */
const SCORE_LEVELS = [
  { min: 80, label: '优秀', color: '#52c41a' },
  { min: 60, label: '良好', color: '#1677ff' },
  { min: 40, label: '一般', color: '#fa8c16' },
  { min: 0, label: '较差', color: '#ff4d4f' },
];

/** 标题评分维度 */
interface TitleScoreDetail {
  /** 吸引力评分 0-100 */
  attractiveness: number;
  /** 清晰度评分 0-100 */
  clarity: number;
  /** 情感共鸣评分 0-100 */
  emotion: number;
  /** 长度适宜度评分 0-100 */
  length: number;
}

/** 根据分数获取等级信息 */
function getScoreLevel(score: number) {
  return SCORE_LEVELS.find((l) => score >= l.min) || SCORE_LEVELS[SCORE_LEVELS.length - 1];
}

/** 评分维度配置 */
const SCORE_DIMENSIONS: { key: keyof TitleScoreDetail; label: string }[] = [
  { key: 'attractiveness', label: '吸引力' },
  { key: 'clarity', label: '清晰度' },
  { key: 'emotion', label: '情感共鸣' },
  { key: 'length', label: '长度适宜' },
];

export const TitlePanel: React.FC = () => {
  const { getTitle, setTitle } = useEditorContent();
  const { sendToBackground } = useMessage();

  const [title, setTitleLocal] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<TitleAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  /** 标题评分相关状态 */
  const [scoreLoading, setScoreLoading] = useState(false);
  const [titleScore, setTitleScore] = useState<number | null>(null);
  const [scoreDetail, setScoreDetail] = useState<TitleScoreDetail | null>(null);
  const [scoreSuggestions, setScoreSuggestions] = useState<string[]>([]);

  /** 从编辑器获取标题 */
  const handleFetchTitle = useCallback(async () => {
    try {
      const currentTitle = await getTitle();
      setTitleLocal(currentTitle);
      setSnackbar({
        open: true,
        message: '已获取当前标题',
        severity: 'success',
      });
    } catch {
      setSnackbar({
        open: true,
        message: '获取标题失败',
        severity: 'error',
      });
    }
  }, [getTitle]);

  /** 优化标题 */
  const handleOptimize = useCallback(async () => {
    if (!title.trim()) {
      setSnackbar({
        open: true,
        message: '请先输入或获取标题',
        severity: 'error',
      });
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const result = await sendToBackground(MessageType.AI_TITLE_OPTIMIZE, {
        title,
      });

      if (result?.code === 0 && result?.data) {
        setAnalysis(result.data as TitleAnalysis);
      } else {
        setError(result?.message || '标题优化失败');
      }
    } catch (e: any) {
      setError(e.message || '请求失败');
    } finally {
      setLoading(false);
    }
  }, [title, sendToBackground]);

  /** 标题评分（类似壹伴AI标题评分） */
  const handleScoreTitle = useCallback(async () => {
    if (!title.trim()) {
      setSnackbar({
        open: true,
        message: '请先输入或获取标题',
        severity: 'error',
      });
      return;
    }

    setScoreLoading(true);
    setTitleScore(null);
    setScoreDetail(null);
    setScoreSuggestions([]);

    try {
      // 尝试调用后端标题评分 API
      const result = await sendToBackground(MessageType.AI_TITLE_OPTIMIZE, {
        title,
        action: 'score',
      });

      if (result?.code === 0 && result?.data) {
        const data = result.data;
        // 后端返回了评分数据
        setTitleScore(data.score ?? data.totalScore ?? 0);
        if (data.dimensions) {
          setScoreDetail(data.dimensions as TitleScoreDetail);
        }
        if (data.suggestions) {
          setScoreSuggestions(data.suggestions as string[]);
        }
        if (data.optimizationTips) {
          setScoreSuggestions(data.optimizationTips as string[]);
        }
      } else {
        // 后端不支持评分 API，使用本地启发式评分
        const localScore = computeLocalTitleScore(title);
        setTitleScore(localScore.total);
        setScoreDetail(localScore.detail);
        setScoreSuggestions(localScore.suggestions);
      }
    } catch {
      // 后端不可用时，使用本地启发式评分
      const localScore = computeLocalTitleScore(title);
      setTitleScore(localScore.total);
      setScoreDetail(localScore.detail);
      setScoreSuggestions(localScore.suggestions);
    } finally {
      setScoreLoading(false);
    }
  }, [title, sendToBackground]);

  /** 本地启发式标题评分（后端 API 不可用时的 fallback） */
  function computeLocalTitleScore(titleText: string): {
    total: number;
    detail: TitleScoreDetail;
    suggestions: string[];
  } {
    const suggestions: string[] = [];
    const len = titleText.length;

    // 吸引力评分：基于疑问词、数字、感叹号等
    let attractiveness = 50;
    if (/[？?]/.test(titleText)) attractiveness += 15;
    if (/\d/.test(titleText)) attractiveness += 10;
    if (/[！!]/.test(titleText)) attractiveness += 5;
    if (/如何|为什么|怎么办|秘诀|技巧|方法/.test(titleText)) attractiveness += 10;
    if (/最|必|千万|一定|绝对/.test(titleText)) attractiveness += 5;
    attractiveness = Math.min(100, attractiveness);
    if (attractiveness < 60) suggestions.push('可以尝试加入疑问句或数字来提升标题吸引力');

    // 清晰度评分：基于长度和标点
    let clarity = 50;
    if (len >= 8 && len <= 30) clarity += 25;
    else if (len >= 5 && len <= 40) clarity += 15;
    else suggestions.push('标题长度建议控制在8-30字之间');
    if (/[，,、：:]/.test(titleText)) clarity += 10;
    if (len < 5) suggestions.push('标题过短，难以传达核心信息');
    clarity = Math.min(100, clarity);

    // 情感共鸣评分
    let emotion = 40;
    if (/你|我|我们|大家/.test(titleText)) emotion += 15;
    if (/感动|震惊|泪目|暖心|心疼/.test(titleText)) emotion += 15;
    if (/爱|恨|怕|想|希望/.test(titleText)) emotion += 10;
    emotion = Math.min(100, emotion);
    if (emotion < 60) suggestions.push('加入"你""我"等人称代词可增强读者情感共鸣');

    // 长度适宜度
    let lengthScore = 50;
    if (len >= 10 && len <= 22) lengthScore += 35;
    else if (len >= 8 && len <= 28) lengthScore += 25;
    else if (len >= 5 && len <= 35) lengthScore += 10;
    else if (len < 5) lengthScore -= 20;
    if (len > 35) suggestions.push('标题较长，在移动端可能显示不全');
    lengthScore = Math.max(0, Math.min(100, lengthScore));

    const total = Math.round(
      attractiveness * 0.3 + clarity * 0.25 + emotion * 0.25 + lengthScore * 0.2
    );

    return {
      total,
      detail: {
        attractiveness,
        clarity,
        emotion,
        length: lengthScore,
      },
      suggestions,
    };
  }

  /** 应用标题到编辑器 */
  const handleApplyTitle = useCallback(
    async (newTitle: string) => {
      try {
        await setTitle(newTitle);
        setTitleLocal(newTitle);
        setSnackbar({
          open: true,
          message: '标题已应用到编辑器',
          severity: 'success',
        });
      } catch {
        setSnackbar({
          open: true,
          message: '应用标题失败',
          severity: 'error',
        });
      }
    },
    [setTitle]
  );

  /** 复制标题 */
  const handleCopyTitle = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSnackbar({
        open: true,
        message: '已复制',
        severity: 'success',
      });
    } catch {
      setSnackbar({
        open: true,
        message: '复制失败',
        severity: 'error',
      });
    }
  }, []);

  const scoreLevel = analysis ? getScoreLevel(analysis.score) : null;
  const titleScoreLevel = titleScore !== null ? getScoreLevel(titleScore) : null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* 获取当前标题 */}
      <Button
        variant="outlined"
        size="small"
        onClick={handleFetchTitle}
        fullWidth
      >
        获取当前标题
      </Button>

      {/* 标题输入 */}
      <TextField
        placeholder="输入或粘贴文章标题..."
        value={title}
        onChange={(e) => setTitleLocal(e.target.value)}
        size="small"
        fullWidth
        disabled={loading || scoreLoading}
      />

      {/* 操作按钮 */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          variant="contained"
          size="small"
          onClick={handleOptimize}
          disabled={!title.trim() || loading}
          fullWidth
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : '优化标题'}
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={handleScoreTitle}
          disabled={!title.trim() || scoreLoading}
          fullWidth
          startIcon={scoreLoading ? <CircularProgress size={16} color="inherit" /> : <StarIcon />}
        >
          标题评分
        </Button>
      </Box>

      {/* 标题评分结果（对标壹伴AI标题评分） */}
      {titleScore !== null && titleScoreLevel && (
        <Box
          sx={{
            bgcolor: '#fafafa',
            border: '1px solid #e8e8e8',
            borderRadius: 1,
            p: 2,
          }}
        >
          {/* 总分展示 */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
              <CircularProgress
                variant="determinate"
                value={titleScore}
                size={72}
                thickness={4}
                sx={{ color: titleScoreLevel.color }}
              />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography
                  variant="h5"
                  component="div"
                  sx={{ fontWeight: 700, color: titleScoreLevel.color }}
                >
                  {titleScore}
                </Typography>
              </Box>
            </Box>
            <Chip
              label={titleScoreLevel.label}
              size="small"
              sx={{
                mt: 1,
                bgcolor: titleScoreLevel.color,
                color: '#fff',
                fontWeight: 600,
              }}
            />
          </Box>

          {/* 分维度评分 */}
          {scoreDetail && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1.5 }}>
              {SCORE_DIMENSIONS.map((dim) => {
                const value = scoreDetail[dim.key];
                const level = getScoreLevel(value);
                return (
                  <Box key={dim.key}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                      <Typography variant="caption" color="text.secondary">
                        {dim.label}
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: level.color }}>
                        {value}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={value}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: '#e8e8e8',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: level.color,
                          borderRadius: 3,
                        },
                      }}
                    />
                  </Box>
                );
              })}
            </Box>
          )}

          {/* 优化建议 */}
          {scoreSuggestions.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                优化建议
              </Typography>
              {scoreSuggestions.map((suggestion, idx) => (
                <Typography
                  key={idx}
                  variant="caption"
                  sx={{
                    display: 'block',
                    color: '#666',
                    fontSize: '12px',
                    lineHeight: 1.5,
                    '&::before': { content: '"💡 "' },
                  }}
                >
                  {suggestion}
                </Typography>
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* 优化分析结果 */}
      {analysis && (
        <>
          {/* 评分展示 */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              py: 2,
            }}
          >
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
              <CircularProgress
                variant="determinate"
                value={analysis.score}
                size={80}
                thickness={4}
                sx={{ color: scoreLevel?.color }}
              />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography
                  variant="h5"
                  component="div"
                  sx={{ fontWeight: 700, color: scoreLevel?.color }}
                >
                  {analysis.score}
                </Typography>
              </Box>
            </Box>
            <Chip
              label={scoreLevel?.label}
              size="small"
              sx={{
                mt: 1,
                bgcolor: scoreLevel?.color,
                color: '#fff',
                fontWeight: 600,
              }}
            />
          </Box>

          {/* AI 分析 */}
          {analysis.analysis && (
            <Box
              sx={{
                bgcolor: '#f6f8fa',
                borderRadius: 1,
                p: 1.5,
                fontSize: '13px',
                lineHeight: 1.6,
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                AI 分析
              </Typography>
              {analysis.analysis}
            </Box>
          )}

          {/* 备选标题 */}
          {analysis.suggestedTitles?.length > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                备选标题
              </Typography>
              {analysis.suggestedTitles.map(
                (item: SuggestedTitle, idx: number) => (
                  <Card
                    key={idx}
                    variant="outlined"
                    sx={{ mb: 1, borderColor: '#e8e8e8' }}
                  >
                    <CardContent sx={{ py: 1, px: 1.5, '&:last-child': { pb: 1 } }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {item.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.reason}
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ pt: 0, px: 1 }}>
                      <Button
                        size="small"
                        onClick={() => handleApplyTitle(item.title)}
                      >
                        应用
                      </Button>
                      <IconButton
                        size="small"
                        onClick={() => handleCopyTitle(item.title)}
                      >
                        <CopyIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </CardActions>
                  </Card>
                )
              )}
            </Box>
          )}
        </>
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
