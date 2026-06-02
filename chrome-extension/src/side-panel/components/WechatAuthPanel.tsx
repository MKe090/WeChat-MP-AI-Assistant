import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Link,
  Typography,
} from '@mui/material';
import { OpenInNew as OpenIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { useMessage } from '../hooks/use-message';
import { MessageType } from '../../shared/types';

interface Authorization {
  authorizer_appid: string;
  nick_name: string;
  service_type: string;
  verify_type: string;
  principal_name: string;
  expires_at: number;
  updated_at: string;
}

export const WechatAuthPanel: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [authUrl, setAuthUrl] = useState('');
  const [mode, setMode] = useState('');
  const [authorizations, setAuthorizations] = useState<Authorization[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { sendToBackground } = useMessage();

  const loadAuthorizations = useCallback(async () => {
    setError(null);
    try {
      const data = await sendToBackground(MessageType.WECHAT_AUTH_LIST);
      if (data?.code === 0) {
        setAuthorizations(data.data.authorizations || []);
      } else {
        setError(data?.message || '读取授权账号失败');
      }
    } catch (e: any) {
      setError(`无法连接本地服务或扩展后台：${e?.message || '未知错误'}`);
    }
  }, [sendToBackground]);

  useEffect(() => {
    loadAuthorizations();
  }, [loadAuthorizations]);

  const startAuth = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await sendToBackground(MessageType.WECHAT_AUTH_OPEN);
      if (data?.code === 0) {
        setAuthUrl(data.data.authUrl);
        setMode(data.data.mode);
      } else {
        setError(data?.message || '授权初始化失败');
      }
    } catch (e: any) {
      setError(`授权初始化失败：${e?.message || '未知错误'}`);
    } finally {
      setLoading(false);
    }
  }, [sendToBackground]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Alert severity="info" sx={{ fontSize: '12px' }}>
        本地开发默认使用 mock 授权；填入微信开放平台第三方平台配置并关闭 mock 后，会跳转到微信官方扫码授权页。
      </Alert>

      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          variant="contained"
          size="small"
          onClick={startAuth}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <OpenIcon />}
          fullWidth
        >
          公众号扫码授权
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={loadAuthorizations}
          startIcon={<RefreshIcon />}
        >
          刷新
        </Button>
      </Box>

      {authUrl && (
        <Alert severity={mode === 'mock' ? 'warning' : 'success'} sx={{ fontSize: '12px' }}>
          已生成{mode === 'mock' ? '本地模拟' : '微信官方'}授权页。
          授权完成后点击刷新查看账号。
          <Box sx={{ mt: 1 }}>
            <Link href={authUrl} target="_blank" rel="noreferrer">
              手动打开授权页
            </Link>
          </Box>
        </Alert>
      )}

      {authorizations.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
          暂无已授权公众号
        </Typography>
      ) : (
        authorizations.map((item) => (
          <Card key={item.authorizer_appid} variant="outlined">
            <CardContent sx={{ py: 1.5, px: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {item.nick_name || item.authorizer_appid}
                </Typography>
                <Chip label="已授权" color="success" size="small" sx={{ height: 20, fontSize: '11px' }} />
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                AppID: {item.authorizer_appid}
              </Typography>
              {item.principal_name && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  主体: {item.principal_name}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                更新: {item.updated_at}
              </Typography>
            </CardContent>
          </Card>
        ))
      )}

      {error && <Alert severity="error" sx={{ fontSize: '12px' }}>{error}</Alert>}
    </Box>
  );
};
