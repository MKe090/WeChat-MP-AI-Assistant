import { create } from 'zustand';
import { AIMode, AIConfig } from '../../shared/types';

interface AppState {
  activeTab: string;
  aiConfig: AIConfig;
  serverConnected: boolean;
  sidePanelVisible: boolean;
  setActiveTab: (tab: string) => void;
  setAIConfig: (config: Partial<AIConfig>) => void;
  setServerConnected: (connected: boolean) => void;
  setSidePanelVisible: (visible: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'tools',
  aiConfig: {
    mode: 'mock' as AIMode,
    openaiApiKey: '',
    openaiBaseUrl: 'https://api.openai.com/v1',
    openaiModel: 'gpt-4o-mini',
    ollamaBaseUrl: 'http://127.0.0.1:11434',
    ollamaModel: 'qwen2:7b',
    customApiKey: '',
    customBaseUrl: 'https://api.deepseek.com/v1',
    customModel: 'deepseek-chat',
  },
  serverConnected: false,
  sidePanelVisible: true,
  setActiveTab: (tab) => set({ activeTab: tab }),
  setAIConfig: (config) =>
    set((state) => ({
      aiConfig: { ...state.aiConfig, ...config },
    })),
  setServerConnected: (connected) =>
    set({ serverConnected: connected }),
  setSidePanelVisible: (visible) =>
    set({ sidePanelVisible: visible }),
}));
