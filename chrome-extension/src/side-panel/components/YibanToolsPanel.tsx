import React, { useCallback, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  TextField,
  Typography,
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  Link as LinkIcon,
  Visibility as PreviewIcon,
} from '@mui/icons-material';
import { LOCAL_SERVER_URL } from '../../shared/constants';

const STYLE_SNIPPETS = [
  {
    name: '重点提示框',
    html: '<section style="padding:14px 16px;border-left:4px solid #1677ff;background:#f0f6ff;margin:16px 0;"><strong>重点：</strong><p style="margin:8px 0 0;">在这里写需要强调的内容。</p></section>',
  },
  {
    name: '引用卡片',
    html: '<blockquote style="margin:16px 0;padding:12px 16px;background:#fafafa;border-left:3px solid #999;color:#555;">这是一段适合作为金句或摘要的引用。</blockquote>',
  },
  {
    name: '分割标题',
    html: '<h2 style="font-size:18px;text-align:center;margin:24px 0 14px;"><span style="border-bottom:2px solid #1677ff;padding-bottom:4px;">小标题</span></h2>',
  },
];

export const YibanToolsPanel: React.FC = () => {
  const [linkUrl, setLinkUrl] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [qrText, setQrText] = useState('');
  const [previewDark, setPreviewDark] = useState(false);
  const [message, setMessage] = useState('');

  const createShortLink = useCallback(async () => {
    setMessage('');
    const res = await fetch(`${LOCAL_SERVER_URL}/api/tools/short-links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: linkUrl }),
    });
    const data = await res.json();
    if (data?.code === 0) {
      setShortUrl(data.data.shortUrl);
    } else {
      setMessage(data?.message || '短链生成失败');
    }
  }, [linkUrl]);

  const copy = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text);
    setMessage('已复制到剪贴板');
  }, []);

  const qrSrc = qrText
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrText)}`
    : '';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Alert severity="info" sx={{ fontSize: '12px' }}>
        这里集中放置常用编辑增强能力：样式块、短链、二维码和深色预览。
      </Alert>

      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>样式库</Typography>
      {STYLE_SNIPPETS.map((snippet) => (
        <Card key={snippet.name} variant="outlined">
          <CardContent sx={{ py: 1, px: 1.5, '&:last-child': { pb: 1 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{snippet.name}</Typography>
              <Button size="small" startIcon={<CopyIcon />} onClick={() => copy(snippet.html)}>
                复制 HTML
              </Button>
            </Box>
            <Box
              sx={{ mt: 1, fontSize: '12px', border: '1px solid #eee', borderRadius: 1, p: 1, bgcolor: '#fff' }}
              dangerouslySetInnerHTML={{ __html: snippet.html }}
            />
          </CardContent>
        </Card>
      ))}

      <Divider />

      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>短链工具</Typography>
      <TextField
        size="small"
        placeholder="https://example.com/article"
        value={linkUrl}
        onChange={(e) => setLinkUrl(e.target.value)}
        fullWidth
      />
      <Button variant="contained" size="small" startIcon={<LinkIcon />} onClick={createShortLink} disabled={!linkUrl}>
        生成本地短链
      </Button>
      {shortUrl && (
        <Alert severity="success" action={<Button size="small" onClick={() => copy(shortUrl)}>复制</Button>}>
          {shortUrl}
        </Alert>
      )}

      <Divider />

      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>二维码</Typography>
      <TextField
        size="small"
        placeholder="输入链接或文本"
        value={qrText}
        onChange={(e) => setQrText(e.target.value)}
        fullWidth
      />
      {qrSrc && (
        <Box sx={{ textAlign: 'center', p: 1 }}>
          <img src={qrSrc} alt="二维码" width={180} height={180} />
        </Box>
      )}

      <Divider />

      <Button
        variant={previewDark ? 'contained' : 'outlined'}
        size="small"
        startIcon={<PreviewIcon />}
        onClick={() => setPreviewDark((v) => !v)}
      >
        {previewDark ? '关闭深色预览' : '打开深色预览'}
      </Button>
      {previewDark && (
        <Box sx={{ bgcolor: '#111827', color: '#f9fafb', borderRadius: 1, p: 2, fontSize: '13px' }}>
          深色预览用于检查文章封面、标题和正文在暗色环境下的可读性。
        </Box>
      )}

      {message && <Alert severity="success" sx={{ fontSize: '12px' }}>{message}</Alert>}
    </Box>
  );
};
