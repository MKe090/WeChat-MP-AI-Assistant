import React, { useCallback, useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Select,
  MenuItem,
  Button,
  FormControl,
  InputLabel,
  Typography,
  Alert,
  Divider,
  CircularProgress,
  Snackbar,
  Chip,
} from '@mui/material';
import { useAppStore } from '../store/use-app-store';
import { MessageType } from '../../shared/types';
import { createMessage, sendMessage } from '../../shared/messages';

export const SettingsPanel: React.FC = () => {
  const { aiConfig, setAIConfig, serverConnected, setServerConnected } =
    useAppStore();
  const [testing, setTesting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  /** 页面加载时从 chrome.storage 读取配置 */
  useEffect(() => {
    chrome.storage.local.get('aiConfig', (result) => {
      if (result.aiConfig) {
        setAIConfig(result.aiConfig);
      }
    });
  }, [setAIConfig]);

  /** 保存配置到 chrome.storage 并通知 Background 同步到本地服务 */
  const handleSave = useCallback(() => {
    chrome.storage.local.set({ aiConfig }, () => {
      setSaved(true);
      setSnackbar({
        open: true,
        message: '配置已保存',
        severity: 'success',
      });
      setTimeout(() => setSaved(false), 2000);

      // 通知 Background 同步 AI 模式到本地服务
      const msg = createMessage(MessageType.AI_CONFIG_UPDATE, 'side-panel', {
        mode: aiConfig.mode,
        openaiApiKey: aiConfig.openaiApiKey,
        openaiBaseUrl: aiConfig.openaiBaseUrl,
        openaiModel: aiConfig.openaiModel,
        ollamaBaseUrl: aiConfig.ollamaBaseUrl,
        ollamaModel: aiConfig.ollamaModel,
        // 传递自定义 API 配置，供后端动态使用
        ...(aiConfig.mode === 'custom'
          ? {
              customApiKey: aiConfig.customApiKey,
              customBaseUrl: aiConfig.customBaseUrl,
              customModel: aiConfig.customModel,
            }
          : {}),
      });
      sendMessage(msg).catch((err) => {
        console.warn('[WAA] Failed to sync AI config to local server:', err);
      });
    });
  }, [aiConfig]);

  /** 测试本地服务连接（通过 Background 代理，避免 content script 的 CORS 限制） */
  const handleTestConnection = useCallback(async () => {
    setTesting(true);
    try {
      const msg = createMessage(MessageType.SERVER_HEALTH_CHECK, 'side-panel');
      const res = await sendMessage(msg);
      const ok = res?.data?.connected === true;
      setServerConnected(ok);
      setSnackbar({
        open: true,
        message: ok ? '连接成功' : '连接失败',
        severity: ok ? 'success' : 'error',
      });
    } catch {
      setServerConnected(false);
      setSnackbar({
        open: true,
        message: '无法连接到本地服务',
        severity: 'error',
      });
    } finally {
      setTesting(false);
    }
  }, [setServerConnected]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      {!serverConnected && (
        <Alert severity="warning" sx={{ fontSize: '12px' }}>
          本地服务未连接，请确保已启动本地服务（127.0.0.1:3456）
        </Alert>
      )}

      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
        AI 配置
      </Typography>

      <FormControl fullWidth size="small">
        <InputLabel>AI 模式</InputLabel>
        <Select
          value={aiConfig.mode}
          label="AI 模式"
          onChange={(e) =>
            setAIConfig({ mode: e.target.value as 'openai' | 'ollama' | 'custom' | 'mock' })
          }
        >
          <MenuItem value="mock">本地 Mock 测试</MenuItem>
          <MenuItem value="openai">OpenAI API</MenuItem>
          <MenuItem value="custom">自定义 API (DeepSeek等)</MenuItem>
          <MenuItem value="ollama">Ollama 本地模型</MenuItem>
        </Select>
      </FormControl>

      {aiConfig.mode === 'openai' && (
        <>
          <TextField
            label="API Key"
            type="password"
            size="small"
            value={aiConfig.openaiApiKey}
            onChange={(e) =>
              setAIConfig({ openaiApiKey: e.target.value })
            }
            fullWidth
          />
          <TextField
            label="Base URL"
            size="small"
            value={aiConfig.openaiBaseUrl}
            onChange={(e) =>
              setAIConfig({ openaiBaseUrl: e.target.value })
            }
            fullWidth
            placeholder="https://api.openai.com/v1"
          />
          <TextField
            label="模型"
            size="small"
            value={aiConfig.openaiModel}
            onChange={(e) =>
              setAIConfig({ openaiModel: e.target.value })
            }
            fullWidth
            placeholder="gpt-4o-mini"
          />
        </>
      )}

      {aiConfig.mode === 'mock' && (
        <Alert severity="info" sx={{ fontSize: '11px', py: 0.5 }}>
          Mock 模式不消耗模型额度，适合本地构建、扫码授权、编辑器注入和端到端链路测试。
        </Alert>
      )}

      {aiConfig.mode === 'custom' && (
        <>
          <Alert severity="info" sx={{ fontSize: '11px', py: 0.5 }}>
            支持 DeepSeek、智谱 GLM、Moonshot、零一万物等 OpenAI 兼容 API
          </Alert>
          <TextField
            label="API Key"
            type="password"
            size="small"
            value={aiConfig.customApiKey}
            onChange={(e) =>
              setAIConfig({ customApiKey: e.target.value })
            }
            fullWidth
          />
          <TextField
            label="Base URL"
            size="small"
            value={aiConfig.customBaseUrl}
            onChange={(e) =>
              setAIConfig({ customBaseUrl: e.target.value })
            }
            fullWidth
            placeholder="https://api.deepseek.com/v1"
            helperText="填写你的 API 服务商提供的 Base URL"
          />
          <TextField
            label="模型名称"
            size="small"
            value={aiConfig.customModel}
            onChange={(e) =>
              setAIConfig({ customModel: e.target.value })
            }
            fullWidth
            placeholder="deepseek-chat"
            helperText="如 deepseek-chat, glm-4-flash, moonshot-v1-8k 等"
          />
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            <Chip
              label="DeepSeek"
              size="small"
              variant="outlined"
              onClick={() =>
                setAIConfig({
                  customBaseUrl: 'https://api.deepseek.com/v1',
                  customModel: 'deepseek-chat',
                })
              }
              sx={{ fontSize: '11px' }}
            />
            <Chip
              label="智谱 GLM"
              size="small"
              variant="outlined"
              onClick={() =>
                setAIConfig({
                  customBaseUrl: 'https://open.bigmodel.cn/api/paas/v4',
                  customModel: 'glm-4-flash',
                })
              }
              sx={{ fontSize: '11px' }}
            />
            <Chip
              label="Moonshot"
              size="small"
              variant="outlined"
              onClick={() =>
                setAIConfig({
                  customBaseUrl: 'https://api.moonshot.cn/v1',
                  customModel: 'moonshot-v1-8k',
                })
              }
              sx={{ fontSize: '11px' }}
            />
            <Chip
              label="零一万物"
              size="small"
              variant="outlined"
              onClick={() =>
                setAIConfig({
                  customBaseUrl: 'https://api.lingyiwanwu.com/v1',
                  customModel: 'yi-lightning',
                })
              }
              sx={{ fontSize: '11px' }}
            />
          </Box>
        </>
      )}

      {aiConfig.mode === 'ollama' && (
        <>
          <TextField
            label="Ollama 地址"
            size="small"
            value={aiConfig.ollamaBaseUrl}
            onChange={(e) =>
              setAIConfig({ ollamaBaseUrl: e.target.value })
            }
            fullWidth
            placeholder="http://127.0.0.1:11434"
          />
          <TextField
            label="模型"
            size="small"
            value={aiConfig.ollamaModel}
            onChange={(e) =>
              setAIConfig({ ollamaModel: e.target.value })
            }
            fullWidth
            placeholder="qwen2:7b"
          />
        </>
      )}

      <Divider />

      {/* 测试连接按钮 */}
      <Button
        variant="outlined"
        size="small"
        onClick={handleTestConnection}
        disabled={testing}
        fullWidth
        color={serverConnected ? 'success' : 'primary'}
      >
        {testing ? (
          <CircularProgress size={20} color="inherit" />
        ) : serverConnected ? (
          '✓ 连接正常 — 重新测试'
        ) : (
          '测试连接'
        )}
      </Button>

      {/* 保存按钮 */}
      <Button
        variant="contained"
        size="small"
        onClick={handleSave}
        color={saved ? 'success' : 'primary'}
        fullWidth
      >
        {saved ? '✓ 已保存' : '保存配置'}
      </Button>

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
