import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
} from '@mui/material';
import { Delete as DeleteIcon, Visibility as PreviewIcon, Save as SaveIcon } from '@mui/icons-material';
import { useEditorContent } from '../hooks/use-editor-content';
import { LOCAL_SERVER_URL } from '../../shared/constants';
import { Template } from '../../shared/types';
import { sanitizeHtml } from '../../shared/sanitize';

/** 分类选项 */
const CATEGORIES = ['全部', '通用', '科技', '商务', '文艺', '教育'];

/** 模板预览对话框 */
const TemplatePreviewDialog: React.FC<{
  open: boolean;
  template: Template | null;
  onClose: () => void;
}> = ({ open, template, onClose }) => {
  if (!template) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontSize: '16px' }}>{template.name} - 预览</DialogTitle>
      <DialogContent>
        <Box
          sx={{
            border: '1px solid #e8e8e8',
            borderRadius: 1,
            p: 2,
            maxHeight: 400,
            overflow: 'auto',
            bgcolor: '#fff',
            '& img': { maxWidth: '100%' },
            fontSize: '14px',
          }}
          dangerouslySetInnerHTML={{
            __html: sanitizeHtml(template.styleHtml || template.preview || '<p style="color:#999">暂无预览内容</p>'),
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>关闭</Button>
      </DialogActions>
    </Dialog>
  );
};

export const TemplatePanel: React.FC = () => {
  const { getContent, setContent } = useEditorContent();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [loading, setLoading] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState('通用');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  /** 加载模板列表 */
  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${LOCAL_SERVER_URL}/api/templates`);
      const data = await res.json();
      if (data?.code === 0 && data?.data?.templates) {
        setTemplates(data.data.templates as Template[]);
      }
    } catch {
      // 静默处理
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  /** 分类筛选 */
  const filteredTemplates =
    selectedCategory === '全部'
      ? templates
      : templates.filter((t) => t.category === selectedCategory);

  /** 预览模板 */
  const handlePreview = useCallback((template: Template) => {
    setPreviewTemplate(template);
  }, []);

  /** 应用模板 */
  const handleApply = useCallback(
    async (template: Template) => {
      try {
        await setContent(template.styleHtml);
        setSnackbar({
          open: true,
          message: '模板已应用到编辑器',
          severity: 'success',
        });
      } catch {
        setSnackbar({
          open: true,
          message: '应用模板失败',
          severity: 'error',
        });
      }
    },
    [setContent]
  );

  /** 删除模板 */
  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await fetch(`${LOCAL_SERVER_URL}/api/templates/${id}`, {
          method: 'DELETE',
        });
        setTemplates((prev) => prev.filter((t) => t.id !== id));
        setSnackbar({
          open: true,
          message: '模板已删除',
          severity: 'success',
        });
      } catch {
        setSnackbar({
          open: true,
          message: '删除失败',
          severity: 'error',
        });
      }
    },
    []
  );

  /** 保存当前排版为模板 */
  const handleSaveTemplate = useCallback(async () => {
    if (!newTemplateName.trim()) {
      setSnackbar({
        open: true,
        message: '请输入模板名称',
        severity: 'error',
      });
      return;
    }

    try {
      const html = await getContent();
      if (!html) {
        setSnackbar({
          open: true,
          message: '编辑器内容为空',
          severity: 'error',
        });
        return;
      }

      const res = await fetch(`${LOCAL_SERVER_URL}/api/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTemplateName,
          category: newTemplateCategory,
          styleHtml: html,
          styleCss: '',
          preview: html.substring(0, 200),
        }),
      });

      const data = await res.json();
      if (data?.code === 0) {
        setSnackbar({
          open: true,
          message: '模板已保存',
          severity: 'success',
        });
        setShowSaveDialog(false);
        setNewTemplateName('');
        loadTemplates();
      } else {
        setSnackbar({
          open: true,
          message: data?.message || '保存失败',
          severity: 'error',
        });
      }
    } catch {
      setSnackbar({
        open: true,
        message: '保存失败',
        severity: 'error',
      });
    }
  }, [newTemplateName, newTemplateCategory, getContent, loadTemplates]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* 保存模板按钮 */}
      <Button
        variant="contained"
        size="small"
        onClick={() => setShowSaveDialog(true)}
        startIcon={<SaveIcon />}
        fullWidth
      >
        保存当前排版为模板
      </Button>

      {/* 分类筛选 */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {CATEGORIES.map((cat) => (
          <Chip
            key={cat}
            label={cat}
            size="small"
            variant={selectedCategory === cat ? 'filled' : 'outlined'}
            color={selectedCategory === cat ? 'primary' : 'default'}
            onClick={() => setSelectedCategory(cat)}
            sx={{ fontSize: '12px' }}
          />
        ))}
      </Box>

      {/* 模板列表 */}
      {loading ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          加载中...
        </Typography>
      ) : filteredTemplates.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          暂无模板
        </Typography>
      ) : (
        filteredTemplates.map((template) => (
          <Card
            key={template.id}
            variant="outlined"
            sx={{ borderColor: '#e8e8e8' }}
          >
            <CardContent sx={{ py: 1, px: 1.5, '&:last-child': { pb: 1 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {template.name}
                </Typography>
                {template.category && (
                  <Chip
                    label={template.category}
                    size="small"
                    variant="outlined"
                    sx={{ height: 18, fontSize: '10px' }}
                  />
                )}
              </Box>
              {/* 缩略图色块 */}
              <Box
                sx={{
                  width: '100%',
                  height: 40,
                  borderRadius: 0.5,
                  bgcolor: '#f5f5f5',
                  border: '1px solid #eee',
                  overflow: 'hidden',
                  fontSize: '10px',
                  color: '#999',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(template.preview
                    ? template.preview.substring(0, 100)
                    : '预览'),
                }}
              />
            </CardContent>
            <CardActions sx={{ pt: 0, px: 1 }}>
              <Button
                size="small"
                startIcon={<PreviewIcon sx={{ fontSize: 14 }} />}
                onClick={() => handlePreview(template)}
              >
                预览
              </Button>
              <Button size="small" onClick={() => handleApply(template)}>
                应用
              </Button>
              <IconButton
                size="small"
                onClick={() => handleDelete(template.id)}
                sx={{ ml: 'auto' }}
              >
                <DeleteIcon sx={{ fontSize: 16, color: '#ff4d4f' }} />
              </IconButton>
            </CardActions>
          </Card>
        ))
      )}

      {/* 刷新按钮 */}
      <Button variant="text" size="small" onClick={loadTemplates} sx={{ fontSize: '12px' }}>
        刷新模板列表
      </Button>

      {/* 模板预览对话框 */}
      <TemplatePreviewDialog
        open={!!previewTemplate}
        template={previewTemplate}
        onClose={() => setPreviewTemplate(null)}
      />

      {/* 保存模板对话框 */}
      <Dialog
        open={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontSize: '16px' }}>保存排版为模板</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
            <TextField
              label="模板名称"
              placeholder="输入模板名称..."
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              size="small"
              fullWidth
            />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {CATEGORIES.filter((c) => c !== '全部').map((cat) => (
                <Chip
                  key={cat}
                  label={cat}
                  size="small"
                  variant={newTemplateCategory === cat ? 'filled' : 'outlined'}
                  color={newTemplateCategory === cat ? 'primary' : 'default'}
                  onClick={() => setNewTemplateCategory(cat)}
                />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSaveDialog(false)}>取消</Button>
          <Button variant="contained" onClick={handleSaveTemplate}>
            保存
          </Button>
        </DialogActions>
      </Dialog>

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
