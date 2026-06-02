import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Alert,
  Chip,
  Divider,
  Button,
  CircularProgress,
} from '@mui/material';
import { SettingsForm } from './SettingsForm';
import { MessageType } from '../../shared/types';
import { createMessage, sendMessage } from '../../shared/messages';

export const PopupMain: React.FC = () => {
  const [serverConnected, setServerConnected] = useState(false);
  const [aiMode, setAiMode] = useState<string>('openai');
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // 检查本地服务连接状态
    checkHealth();

    // 从 storage 读取 AI 模式
    chrome.storage.local.get('aiConfig', (result) => {
      if (result.aiConfig?.mode) {
        setAiMode(result.aiConfig.mode);
      }
    });
  }, []);

  /** 健康检查（通过 Background 代理，避免 CORS 问题） */
  const checkHealth = async () => {
    setChecking(true);
    try {
      const msg = createMessage(MessageType.SERVER_HEALTH_CHECK, 'popup');
      const res = await sendMessage(msg);
      setServerConnected(res?.data?.connected === true);
    } catch {
      setServerConnected(false);
    } finally {
      setChecking(false);
    }
  };

  /** 打开侧边面板 */
  const handleOpenSidePanel = () => {
    // 发消息给 Content Script 切换面板可见性
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'TOGGLE_SIDE_PANEL',
          source: 'popup',
          payload: { visible: true },
          timestamp: Date.now(),
        });
      }
    });
    // 关闭 popup
    window.close();
  };

  /** 启动/检测本地服务 */
  const handleCheckLocalServer = async () => {
    setChecking(true);
    try {
      const msg = createMessage(MessageType.SERVER_HEALTH_CHECK, 'popup');
      const res = await sendMessage(msg);
      const ok = res?.data?.connected === true;
      setServerConnected(ok);
      if (!ok) {
        // 连不上时打开浏览器标签页提示用户启动
        chrome.tabs.create({ url: 'http://127.0.0.1:3456' });
      }
    } catch {
      setServerConnected(false);
      chrome.tabs.create({ url: 'http://127.0.0.1:3456' });
    } finally {
      setChecking(false);
    }
  };

  /** AI 模式显示名 */
  const getModeLabel = (mode: string) => {
    switch (mode) {
      case 'openai': return 'OpenAI';
      case 'custom': return '自定义API';
      case 'ollama': return 'Ollama';
      default: return mode;
    }
  };

  return (
    <Box sx={{ width: 320, p: 2 }}>
      {/* 标题与状态 */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1,
        }}
      >
        <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 600 }}>
          🤖 公众号AI助手
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {checking && <CircularProgress size={14} />}
          <Chip
            label={serverConnected ? '已连接' : '未连接'}
            color={serverConnected ? 'success' : 'default'}
            size="small"
          />
        </Box>
      </Box>

      {!serverConnected && (
        <Alert severity="warning" sx={{ mb: 1, fontSize: '12px' }}>
          本地服务未启动，请先运行：cd local-server && npm run dev
        </Alert>
      )}

      {/* AI 模式指示 */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          当前 AI 模式：
        </Typography>
        <Chip
          label={getModeLabel(aiMode)}
          size="small"
          variant="outlined"
          color={aiMode === 'custom' ? 'warning' : aiMode === 'openai' ? 'primary' : 'secondary'}
          sx={{ fontSize: '11px' }}
        />
      </Box>

      <Divider sx={{ my: 1 }} />

      {/* 快捷操作按钮 */}
      <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
        <Button
          variant="contained"
          size="small"
          onClick={handleOpenSidePanel}
          fullWidth
        >
          打开侧边面板
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={handleCheckLocalServer}
          fullWidth
          color={serverConnected ? 'success' : 'primary'}
          disabled={checking}
        >
          {checking ? '检测中…' : serverConnected ? '✓ 服务在线' : '检测服务'}
        </Button>
      </Box>

      <Divider sx={{ my: 1 }} />

      {/* 设置表单 */}
      <SettingsForm />
    </Box>
  );
};
