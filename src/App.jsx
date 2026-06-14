import React from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import ErrorBoundary from './components/common/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { ThemeModeProvider } from './context/ThemeModeContext';
import AppRoutes from './routes';

function App() {
  return (
    <ErrorBoundary>
      <ThemeModeProvider>
        <CssBaseline />
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeModeProvider>
    </ErrorBoundary>
  );
}

export default App;
