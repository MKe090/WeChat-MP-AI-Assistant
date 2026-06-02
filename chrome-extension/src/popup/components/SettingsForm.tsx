import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Select,
  MenuItem,
  Button,
  FormControl,
  InputLabel,
  Chip,
} from '@mui/material';
import { MessageType } from '../../shared/types';
import { createMessage, sendMessage } from '../../shared/messages';

interface AIConfigData {
  mode: string;
  openaiApiKey: string;
  openaiBaseUrl: string;
  openaiModel: string;
  ollamaBaseUrl: string;
  ollamaModel: string;
  customApiKey: string;
  customBaseUrl: string;
  customModel: string;
}

export const SettingsForm: React.FC = () => {
  const [config, setConfig] = useState<AIConfigData>({
    mode: 'openai',
    openaiApiKey: '',
    openaiBaseUrl: 'https://api.openai.com/v1',
    openaiModel: 'gpt-4o-mini',
    ollamaBaseUrl: 'http://127.0.0.1:11434',
    ollamaModel: 'qwen2:7b',
    customApiKey: '',
    customBaseUrl: 'https://api.deepseek.com/v1',
    customModel: 'deepseek-chat',
  });
  const [saved, setSaved] = useState<boolean>(false);

  useEffect(() => {
    chrome.storage.local.get('aiConfig', (result) => {
      if (result.aiConfig) {
        setConfig((prev) => ({ ...prev, ...result.aiConfig }));
      }
    });
  }, []);

  const updateConfig = (partial: Partial<AIConfigData>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  };

  const handleSave = () => {
    chrome.storage.local.set({ aiConfig: config }, () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);

      // 通知 Background 同步 AI 模式到本地服务
      const msg = createMessage(MessageType.AI_CONFIG_UPDATE, 'popup', {
        mode: config.mode,
        ...(config.mode === 'custom'
          ? {
              customApiKey: config.customApiKey,
              customBaseUrl: config.customBaseUrl,
              customModel: config.customModel,
            }
          : {}),
      });
      sendMessage(msg).catch(() => {});
    });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <FormControl size="small" fullWidth>
        <InputLabel>AI模式</InputLabel>
        <Select
          value={config.mode}
          label="AI模式"
          onChange={(e) => updateConfig({ mode: e.target.value })}
        >
          <MenuItem value="openai">OpenAI</MenuItem>
          <MenuItem value="custom">自定义 API</MenuItem>
          <MenuItem value="ollama">Ollama</MenuItem>
        </Select>
      </FormControl>

      {config.mode === 'openai' && (
        <>
          <TextField
            label="API Key"
            type="password"
            size="small"
            fullWidth
            value={config.openaiApiKey}
            onChange={(e) => updateConfig({ openaiApiKey: e.target.value })}
          />
          <TextField
            label="Base URL"
            size="small"
            fullWidth
            value={config.openaiBaseUrl}
            onChange={(e) => updateConfig({ openaiBaseUrl: e.target.value })}
          />
          <TextField
            label="模型"
            size="small"
            fullWidth
            value={config.openaiModel}
            onChange={(e) => updateConfig({ openaiModel: e.target.value })}
          />
        </>
      )}

      {config.mode === 'custom' && (
        <>
          <TextField
            label="API Key"
            type="password"
            size="small"
            fullWidth
            value={config.customApiKey}
            onChange={(e) => updateConfig({ customApiKey: e.target.value })}
          />
          <TextField
            label="Base URL"
            size="small"
            fullWidth
            value={config.customBaseUrl}
            onChange={(e) => updateConfig({ customBaseUrl: e.target.value })}
            placeholder="https://api.deepseek.com/v1"
          />
          <TextField
            label="模型"
            size="small"
            fullWidth
            value={config.customModel}
            onChange={(e) => updateConfig({ customModel: e.target.value })}
            placeholder="deepseek-chat"
          />
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            <Chip label="DeepSeek" size="small" variant="outlined" onClick={() => updateConfig({ customBaseUrl: 'https://api.deepseek.com/v1', customModel: 'deepseek-chat' })} sx={{ fontSize: '10px' }} />
            <Chip label="智谱" size="small" variant="outlined" onClick={() => updateConfig({ customBaseUrl: 'https://open.bigmodel.cn/api/paas/v4', customModel: 'glm-4-flash' })} sx={{ fontSize: '10px' }} />
            <Chip label="Moonshot" size="small" variant="outlined" onClick={() => updateConfig({ customBaseUrl: 'https://api.moonshot.cn/v1', customModel: 'moonshot-v1-8k' })} sx={{ fontSize: '10px' }} />
          </Box>
        </>
      )}

      {config.mode === 'ollama' && (
        <>
          <TextField
            label="Ollama 地址"
            size="small"
            fullWidth
            value={config.ollamaBaseUrl}
            onChange={(e) => updateConfig({ ollamaBaseUrl: e.target.value })}
          />
          <TextField
            label="模型"
            size="small"
            fullWidth
            value={config.ollamaModel}
            onChange={(e) => updateConfig({ ollamaModel: e.target.value })}
          />
        </>
      )}

      <Button
        variant="contained"
        size="small"
        onClick={handleSave}
        color={saved ? 'success' : 'primary'}
      >
        {saved ? '✓ 已保存' : '保存'}
      </Button>
    </Box>
  );
};
