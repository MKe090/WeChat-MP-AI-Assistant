import React from 'react';
import {
  CssBaseline,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import { PopupMain } from './components/PopupMain';

const theme = createTheme({
  palette: {
    primary: { main: '#1677ff' },
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

export const App: React.FC = () => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <PopupMain />
  </ThemeProvider>
);
