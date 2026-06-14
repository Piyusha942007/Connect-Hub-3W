import { createTheme } from '@mui/material/styles';

export const getAppTheme = (mode) => {
  const isDark = mode === 'dark';
  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? '#90caf9' : '#1976d2',
        light: isDark ? '#e3f2fd' : '#42a5f5',
        dark: isDark ? '#42a5f5' : '#1565c0',
        contrastText: isDark ? '#0f172a' : '#fff',
      },
      secondary: {
        main: '#9c27b0',
        light: '#ba68c8',
        dark: '#7b1fa2',
        contrastText: '#fff',
      },
      background: {
        default: isDark ? '#0f172a' : '#f5f7fb',
        paper: isDark ? '#1e293b' : '#ffffff',
      },
      text: {
        primary: isDark ? '#f8fafc' : '#2c3e50',
        secondary: isDark ? '#94a3b8' : '#607d8b',
      },
      divider: isDark ? 'rgba(255, 255, 255, 0.08)' : '#eceff1',
    },
    typography: {
      fontFamily: '"Outfit", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 700,
      },
      h2: {
        fontWeight: 700,
      },
      h6: {
        fontWeight: 600,
        fontSize: '1.1rem',
        lineHeight: 1.4,
      },
      subtitle1: {
        fontWeight: 500,
      },
      body1: {
        lineHeight: 1.5,
        color: isDark ? '#cbd5e1' : '#37474f',
      },
      button: {
        textTransform: 'none',
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 12,
    },
    shadows: [
      'none',
      '0px 2px 4px rgba(0, 0, 0, 0.02)',
      isDark ? '0px 4px 12px rgba(0, 0, 0, 0.15)' : '0px 4px 12px rgba(0, 0, 0, 0.03)',
      isDark ? '0px 6px 16px rgba(0, 0, 0, 0.2)' : '0px 6px 16px rgba(0, 0, 0, 0.04)',
      isDark ? '0px 8px 24px rgba(144, 202, 249, 0.1)' : '0px 8px 24px rgba(25, 118, 210, 0.04)',
      isDark ? '0px 10px 32px rgba(0, 0, 0, 0.25)' : '0px 10px 32px rgba(0, 0, 0, 0.05)',
      ...Array(19).fill('none'),
    ],
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: isDark ? '#0f172a' : '#f5f7fb',
            color: isDark ? '#f8fafc' : '#2c3e50',
            transition: 'background-color 0.25s ease-in-out, color 0.25s ease-in-out',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            padding: '8px 20px',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: isDark ? '0px 4px 12px rgba(144, 202, 249, 0.25)' : '0px 4px 12px rgba(25, 118, 210, 0.15)',
            },
          },
          contained: {
            background: isDark
              ? 'linear-gradient(135deg, #90caf9 0%, #42a5f5 100%)'
              : 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
            color: isDark ? '#0f172a' : '#fff',
            '&.Mui-disabled': {
              background: isDark ? 'rgba(255, 255, 255, 0.12)' : '#e0e0e0',
              color: isDark ? 'rgba(255, 255, 255, 0.3)' : '#ffffff',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            borderRadius: 12,
            boxShadow: isDark ? '0px 4px 12px rgba(0, 0, 0, 0.25)' : '0px 4px 12px rgba(0, 0, 0, 0.03)',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e5e7eb',
            overflow: 'hidden',
            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out, background-color 0.25s ease-in-out, border-color 0.25s ease-in-out',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: isDark ? '0px 8px 24px rgba(0, 0, 0, 0.35)' : '0px 8px 24px rgba(0, 0, 0, 0.06)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            boxShadow: isDark ? '0px 4px 12px rgba(0, 0, 0, 0.25)' : '0px 4px 12px rgba(0, 0, 0, 0.03)',
            transition: 'background-color 0.25s ease-in-out',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(20px)',
            borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(230, 235, 245, 0.8)',
            boxShadow: 'none',
            color: isDark ? '#f8fafc' : '#2c3e50',
            transition: 'background-color 0.25s ease-in-out, border-color 0.25s ease-in-out',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
              backgroundColor: isDark ? '#0f172a' : '#fafbfc',
              color: isDark ? '#f8fafc' : '#2c3e50',
              '&:hover fieldset': {
                borderColor: isDark ? 'rgba(255, 255, 255, 0.24)' : '#b0bec5',
              },
              '&.Mui-focused fieldset': {
                borderColor: isDark ? '#90caf9' : '#1976d2',
              },
            },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            backgroundImage: 'none',
          },
        },
      },
    },
  });
};
export default getAppTheme('light');
