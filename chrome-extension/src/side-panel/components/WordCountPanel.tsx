import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Divider,
  CircularProgress,
} from '@mui/material';
import { useEditorContent } from '../hooks/use-editor-content';

/** 字数统计信息 */
interface WordCountInfo {
  /** 总字数（纯文本字符数） */
  charCount: number;
  /** 中文字数 */
  chineseCount: number;
  /** 英文单词数 */
  englishWordCount: number;
  /** 图片数量 */
  imageCount: number;
  /** 段落数量 */
  paragraphCount: number;
  /** 预估阅读时间（分钟） */
  readingTime: number;
}

/**
 * 从 HTML 内容中提取字数统计信息
 * 按 300字/分钟 估算阅读时间
 */
function computeWordCount(html: string): WordCountInfo {
  if (!html) {
    return {
      charCount: 0,
      chineseCount: 0,
      englishWordCount: 0,
      imageCount: 0,
      paragraphCount: 0,
      readingTime: 0,
    };
  }

  // 计算图片数量
  const imgMatch = html.match(/<img[\s>]/gi);
  const imageCount = imgMatch ? imgMatch.length : 0;

  // 计算段落数量
  const pMatch = html.match(/<p[\s>]/gi);
  const paragraphCount = pMatch ? pMatch.length : 0;

  // 提取纯文本（移除所有 HTML 标签）
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  const plainText = tempDiv.textContent || tempDiv.innerText || '';

  // 计算中文字数
  const chineseMatch = plainText.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g);
  const chineseCount = chineseMatch ? chineseMatch.length : 0;

  // 计算英文单词数（以空格分隔的非空连续字母/数字序列）
  const englishText = plainText.replace(/[\u4e00-\u9fff\u3400-\u4dbf]/g, ' ');
  const englishWords = englishText.split(/\s+/).filter((w) => w.length > 0 && /[a-zA-Z0-9]/.test(w));
  const englishWordCount = englishWords.length;

  // 总字符数（去掉空白字符后）
  const charCount = plainText.replace(/\s/g, '').length;

  // 预估阅读时间（中文 300字/分钟，英文 200词/分钟，混合计算）
  const readingMinutes = (chineseCount / 300) + (englishWordCount / 200);
  const readingTime = Math.max(1, Math.ceil(readingMinutes));

  return {
    charCount,
    chineseCount,
    englishWordCount,
    imageCount,
    paragraphCount,
    readingTime,
  };
}

/** 统计项展示组件 */
const StatItem: React.FC<{
  label: string;
  value: string | number;
  unit?: string;
  icon?: string;
}> = ({ label, value, unit, icon }) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      py: 1,
      px: 1.5,
      borderRadius: 1,
      '&:hover': { bgcolor: '#f5f5f5' },
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {icon && <span style={{ fontSize: '14px' }}>{icon}</span>}
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Box>
    <Typography variant="body2" sx={{ fontWeight: 600 }}>
      {value}
      {unit && (
        <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.3 }}>
          {unit}
        </Typography>
      )}
    </Typography>
  </Box>
);

export const WordCountPanel: React.FC = () => {
  const { getContent } = useEditorContent();

  const [wordCount, setWordCount] = useState<WordCountInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** 计算字数统计 */
  const refreshWordCount = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const html = await getContent();
      const info = computeWordCount(html);
      setWordCount(info);
    } catch {
      setError('获取编辑器内容失败');
    } finally {
      setLoading(false);
    }
  }, [getContent]);

  /** 初始加载 + 定时刷新（每5秒自动更新，实时监听编辑器变化） */
  useEffect(() => {
    refreshWordCount();
    const timer = setInterval(refreshWordCount, 5000);
    return () => clearInterval(timer);
  }, [refreshWordCount]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* 标题 */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          📝 字数统计
        </Typography>
        {loading && <CircularProgress size={16} />}
      </Box>

      {/* 错误提示 */}
      {error && (
        <Typography variant="caption" color="error">
          {error}
        </Typography>
      )}

      {/* 核心数据展示 */}
      {wordCount && (
        <>
          {/* 阅读时间卡片 */}
          <Box
            sx={{
              bgcolor: '#f0f5ff',
              borderRadius: 2,
              p: 2,
              textAlign: 'center',
            }}
          >
            <Typography variant="h3" sx={{ fontWeight: 700, color: '#1677ff', mb: 0.5 }}>
              {wordCount.readingTime}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              预估阅读时间（分钟）
            </Typography>
          </Box>

          <Divider />

          {/* 详细统计 */}
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <StatItem
              icon="📊"
              label="总字符数"
              value={wordCount.charCount}
              unit="字"
            />
            <StatItem
              icon="🇨🇳"
              label="中文字数"
              value={wordCount.chineseCount}
              unit="字"
            />
            <StatItem
              icon="🔤"
              label="英文词数"
              value={wordCount.englishWordCount}
              unit="词"
            />
            <StatItem
              icon="🖼️"
              label="图片数量"
              value={wordCount.imageCount}
              unit="张"
            />
            <StatItem
              icon="¶"
              label="段落数量"
              value={wordCount.paragraphCount}
              unit="段"
            />
          </Box>

          <Divider />

          {/* 阅读时间估算说明 */}
          <Box
            sx={{
              bgcolor: '#fafafa',
              borderRadius: 1,
              p: 1.5,
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              💡 阅读时间按中文 300字/分钟、英文 200词/分钟估算。实际阅读时间因文章类型和读者习惯有所不同。
            </Typography>
          </Box>

          {/* 微信公众号建议字数 */}
          <Box
            sx={{
              bgcolor: '#f6f8fa',
              borderRadius: 1,
              p: 1.5,
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              📌 公众号文章建议：干货类 1500-3000字，故事类 2000-5000字，新闻类 800-1500字。
            </Typography>
          </Box>
        </>
      )}

      {/* 无数据提示 */}
      {!wordCount && !loading && !error && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            请先在编辑器中输入内容
          </Typography>
        </Box>
      )}
    </Box>
  );
};
