import React, { useEffect } from 'react';
import {
  Alert,
  Box,
  ButtonBase,
  Divider,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import {
  Article as ArticleIcon,
  AttachFile as AttachFileIcon,
  AutoFixHigh as AutoFixHighIcon,
  CalendarMonth as CalendarIcon,
  Dashboard as DashboardIcon,
  Description as DescriptionIcon,
  EditNote as EditNoteIcon,
  FactCheck as FactCheckIcon,
  GridView as GridIcon,
  Image as ImageIcon,
  Link as LinkIcon,
  Mic as MicIcon,
  QrCode2 as QrIcon,
  Score as ScoreIcon,
  Settings as SettingsIcon,
  Smartphone as PhoneIcon,
  Title as TitleIcon,
  VerifiedUser as VerifiedUserIcon,
} from '@mui/icons-material';
import { useAppStore } from '../store/use-app-store';
import { SettingsPanel } from './SettingsPanel';
import { WritingPanel } from './WritingPanel';
import { TitlePanel } from './TitlePanel';
import { FormattingPanel } from './FormattingPanel';
import { WordCountPanel } from './WordCountPanel';
import { DiagnosisPanel } from './DiagnosisPanel';
import { ViolationPanel } from './ViolationPanel';
import { TemplatePanel } from './TemplatePanel';
import { DashboardPanel } from './DashboardPanel';
import { WechatAuthPanel } from './WechatAuthPanel';
import { YibanToolsPanel } from './YibanToolsPanel';

const TABS = [
  { id: 'tools', label: '工具箱' },
  { id: 'writing', label: 'AI写作' },
  { id: 'formatting', label: 'AI排版' },
  { id: 'title', label: '标题评分' },
  { id: 'violation', label: '违规检测' },
  { id: 'templates', label: '模板库' },
  { id: 'wechat', label: '公众号授权' },
  { id: 'dashboard', label: '数据看板' },
  { id: 'settings', label: '设置' },
];

const TAB_PANELS: Record<string, React.FC> = {
  tools: YibanToolsPanel,
  writing: WritingPanel,
  title: TitlePanel,
  formatting: FormattingPanel,
  wordcount: WordCountPanel,
  diagnosis: DiagnosisPanel,
  violation: ViolationPanel,
  templates: TemplatePanel,
  wechat: WechatAuthPanel,
  dashboard: DashboardPanel,
  settings: SettingsPanel,
};

const COMMON_TOOLS = [
  { label: '导入文章', icon: ArticleIcon, tab: 'writing' },
  { label: '导入Word', icon: DescriptionIcon, tab: 'writing' },
  { label: '导入MD', icon: EditNoteIcon, tab: 'writing' },
  { label: '生成二维码', icon: QrIcon, tab: 'tools' },
  { label: '手机传图', icon: PhoneIcon, tab: 'tools' },
  { label: '配图中心', icon: ImageIcon, tab: 'tools' },
  { label: '生成长图', icon: GridIcon, tab: 'tools' },
  { label: '标题评分', icon: TitleIcon, tab: 'title' },
  { label: '永久链接', icon: LinkIcon, tab: 'tools' },
  { label: '违规检测', icon: VerifiedUserIcon, tab: 'violation' },
  { label: '渠道码', icon: DashboardIcon, tab: 'dashboard' },
  { label: '往期推荐', icon: FactCheckIcon, tab: 'dashboard' },
  { label: '营销日历', icon: CalendarIcon, tab: 'tools' },
  { label: '拼图', icon: GridIcon, tab: 'tools' },
  { label: 'AI排版', icon: AutoFixHighIcon, tab: 'formatting' },
  { label: '长文转图片', icon: ImageIcon, tab: 'tools' },
  { label: '表格', icon: ScoreIcon, tab: 'tools' },
  { label: '语音输入', icon: MicIcon, tab: 'tools' },
  { label: '添加附件', icon: AttachFileIcon, tab: 'tools' },
];

const RECOMMENDED_TOOLS = [
  { label: 'AI写作', icon: EditNoteIcon, tab: 'writing' },
  { label: '内容诊断', icon: FactCheckIcon, tab: 'diagnosis' },
  { label: '公众号授权', icon: VerifiedUserIcon, tab: 'wechat' },
  { label: '系统设置', icon: SettingsIcon, tab: 'settings' },
];

export const SidePanel: React.FC = () => {
  const { activeTab, setActiveTab, serverConnected } = useAppStore();
  const Panel = TAB_PANELS[activeTab];

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === 'WAA_OPEN_TAB' && event.data.tab) {
        setActiveTab(event.data.tab);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [setActiveTab]);

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#fff',
        color: '#202124',
      }}
    >
      <Box sx={{ px: 2.5, pt: 2.2, pb: 1.4, borderBottom: '1px solid #f0f2f5' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              bgcolor: '#22c55e',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
            }}
          >
            ✓
          </Box>
          <Typography variant="h6" sx={{ fontSize: 18, fontWeight: 800, color: '#22c55e' }}>
            公众号图文工具箱
          </Typography>
        </Box>

        <Box sx={{ mt: 1.4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ color: '#7b8494' }}>
            {serverConnected ? '免费版 · 本地服务已连接' : '免费版 · 本地服务未连接'}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              px: 1,
              py: 0.3,
              borderRadius: 99,
              bgcolor: serverConnected ? '#eafaf0' : '#fff7ed',
              color: serverConnected ? '#16a34a' : '#f97316',
            }}
          >
            v0.1.0
          </Typography>
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {!serverConnected && (
          <Alert severity="warning" sx={{ m: 2, fontSize: 12 }}>
            无法连接本地服务。请确认 127.0.0.1:3456 已启动，并在扩展管理页重新加载插件后刷新公众号编辑页。
          </Alert>
        )}

        <ToolSection title="常用工具" tools={COMMON_TOOLS} onSelect={setActiveTab} />
        <Divider sx={{ mx: 2 }} />
        <ToolSection title="推荐工具" tools={RECOMMENDED_TOOLS} onSelect={setActiveTab} compact />

        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            mt: 1.5,
            px: 1,
            borderTop: '1px solid #f0f2f5',
            borderBottom: '1px solid #f0f2f5',
            minHeight: 42,
            '& .MuiTab-root': {
              minHeight: 42,
              fontSize: 12,
              px: 1.4,
            },
          }}
        >
          {TABS.map((tab) => (
            <Tab key={tab.id} value={tab.id} label={tab.label} />
          ))}
        </Tabs>

        <Box sx={{ p: 2 }}>
          {Panel ? <Panel /> : null}
        </Box>
      </Box>
    </Box>
  );
};

type ToolSectionProps = {
  title: string;
  tools: typeof COMMON_TOOLS;
  onSelect: (tab: string) => void;
  compact?: boolean;
};

const ToolSection: React.FC<ToolSectionProps> = ({ title, tools, onSelect, compact }) => (
  <Box sx={{ px: 2, py: compact ? 1.5 : 2 }}>
    <Typography variant="subtitle2" sx={{ mb: 1.2, fontSize: 15, fontWeight: 800 }}>
      {title}
    </Typography>
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        rowGap: compact ? 1 : 1.4,
        columnGap: 0.8,
      }}
    >
      {tools.map((tool) => {
        const Icon = tool.icon;
        return (
          <ButtonBase
            key={tool.label}
            onClick={() => onSelect(tool.tab)}
            sx={{
              height: compact ? 64 : 76,
              borderRadius: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.7,
              color: '#525866',
              '&:hover': {
                bgcolor: '#f5fbf7',
                color: '#16a34a',
              },
            }}
          >
            <Icon sx={{ fontSize: compact ? 24 : 28 }} />
            <Typography
              variant="caption"
              sx={{
                fontSize: 13,
                lineHeight: 1.2,
                textAlign: 'center',
                whiteSpace: 'normal',
                wordBreak: 'keep-all',
              }}
            >
              {tool.label}
            </Typography>
          </ButtonBase>
        );
      })}
    </Box>
  </Box>
);
