import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';
import { LOCAL_SERVER_URL } from '../../shared/constants';
import { ArticleData } from '../../shared/types';

/** 数据看板概览卡片 */
interface DashboardOverview {
  totalArticles: number;
  avgReadCount: number;
  avgLikeCount: number;
  avgShareCount: number;
}

/** StatCard 小卡片组件 */
const StatCard: React.FC<{
  label: string;
  value: number | string;
  color?: string;
}> = ({ label, value, color = '#1677ff' }) => (
  <Box
    sx={{
      flex: 1,
      bgcolor: '#fafafa',
      border: '1px solid #e8e8e8',
      borderRadius: 1,
      p: 1.5,
      textAlign: 'center',
    }}
  >
    <Typography
      variant="h6"
      sx={{ fontSize: '20px', fontWeight: 700, color }}
    >
      {value}
    </Typography>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
  </Box>
);

export const DashboardPanel: React.FC = () => {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [topArticles, setTopArticles] = useState<ArticleData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasData, setHasData] = useState(true);

  /** 加载看板数据 */
  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${LOCAL_SERVER_URL}/api/data/dashboard`);
      const data = await res.json();

      if (data?.code === 0 && data?.data) {
        const d = data.data;
        setOverview({
          totalArticles: d.overview?.totalArticles || 0,
          avgReadCount: d.overview?.avgReadCount || 0,
          avgLikeCount: d.overview?.avgLikeCount || 0,
          avgShareCount: d.overview?.avgShareCount || 0,
        });
        setTopArticles(
          (d.topArticles || []).map((a: any) => ({
            title: a.title || '无标题',
            url: a.url || '',
            publishTime: a.publish_time || a.publishTime || '',
            readCount: a.read_count || a.readCount || 0,
            likeCount: a.like_count || a.likeCount || 0,
            shareCount: a.share_count || a.shareCount || 0,
            commentCount: a.comment_count || a.commentCount || 0,
          })) as ArticleData[]
        );

        // 判断是否有数据
        if (
          !d.overview?.totalArticles &&
          (!d.topArticles || d.topArticles.length === 0)
        ) {
          setHasData(false);
        } else {
          setHasData(true);
        }
      } else {
        setHasData(false);
      }
    } catch {
      setError('无法连接到本地服务');
      setHasData(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  /** 无数据引导 */
  if (!loading && !hasData && !overview) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 6,
          gap: 2,
        }}
      >
        <Typography variant="h3" sx={{ opacity: 0.3 }}>
          📊
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          暂无数据
        </Typography>
        <Typography variant="caption" color="text.disabled" sx={{ textAlign: 'center' }}>
          请先在内容诊断中采集数据
        </Typography>
        <Button variant="outlined" size="small" onClick={loadDashboard}>
          刷新数据
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* 刷新按钮 */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="text"
          size="small"
          onClick={loadDashboard}
          disabled={loading}
          sx={{ fontSize: '12px' }}
        >
          {loading ? <CircularProgress size={16} /> : '刷新数据'}
        </Button>
      </Box>

      {/* 数据概览卡片 */}
      {overview && (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <StatCard
            label="总文章数"
            value={overview.totalArticles}
            color="#1677ff"
          />
          <StatCard
            label="平均阅读"
            value={overview.avgReadCount.toLocaleString()}
            color="#52c41a"
          />
        </Box>
      )}

      {overview && (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <StatCard
            label="平均点赞"
            value={overview.avgLikeCount.toLocaleString()}
            color="#fa8c16"
          />
          <StatCard
            label="平均分享"
            value={overview.avgShareCount.toLocaleString()}
            color="#722ed1"
          />
        </Box>
      )}

      {/* Top 5 文章列表 */}
      {topArticles.length > 0 && (
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Top 5 文章
          </Typography>
          {topArticles.map((article, idx) => (
            <Card
              key={idx}
              variant="outlined"
              sx={{ mb: 0.5, borderColor: '#e8e8e8' }}
            >
              <CardContent
                sx={{ py: 0.5, px: 1.5, '&:last-child': { pb: 0.5 } }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      color: idx < 3 ? '#ff4d4f' : '#999',
                      minWidth: 20,
                    }}
                  >
                    #{idx + 1}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontSize: '13px',
                    }}
                  >
                    {article.title}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: '#52c41a', whiteSpace: 'nowrap' }}
                  >
                    {article.readCount.toLocaleString()} 阅读
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* 错误提示 */}
      {error && (
        <Typography variant="body2" color="error" sx={{ fontSize: '12px' }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};
