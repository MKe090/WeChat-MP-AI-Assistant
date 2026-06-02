import React from 'react';
import { Box, ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { SidePanel } from './components/SidePanel';

const theme = createTheme({
  palette: {
    primary: { main: '#1677ff' },
    background: { default: '#ffffff' },
  },
  typography: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none' },
      },
    },
  },
});

interface AppProps {
  /** emotion CSS 缓存容器（注入到 Shadow DOM 的 style 元素） */
  styleContainer: HTMLElement;
}

export const App: React.FC<AppProps> = ({ styleContainer }) => {
  // 创建 emotion cache，将 CSS 注入到 Shadow DOM 内部的 style 容器
  const cache = createCache({ key: 'waa', container: styleContainer });

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            width: '100%',
            height: '100vh',
            bgcolor: '#fff',
            overflow: 'auto',
          }}
        >
          <SidePanel />
        </Box>
      </ThemeProvider>
    </CacheProvider>
  );
};
