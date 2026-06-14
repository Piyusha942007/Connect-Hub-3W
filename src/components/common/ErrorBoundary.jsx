import React, { Component } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an error reporting service here
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            minHeight: '100vh',
            backgroundColor: 'background.default',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            p: 3,
          }}
        >
          <Paper
            elevation={2}
            sx={{
              maxWidth: 500,
              width: '100%',
              p: 4,
              textAlign: 'center',
              borderRadius: 4,
            }}
          >
            <ErrorOutlineIcon color="error" sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h5" component="h1" fontWeight="bold" gutterBottom>
              Something went wrong
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              An unexpected error occurred while rendering this page.
              {this.state.error && (
                <Box
                  component="pre"
                  sx={{
                    textAlign: 'left',
                    backgroundColor: '#f5f5f5',
                    p: 2,
                    borderRadius: 2,
                    fontSize: '0.85rem',
                    overflowX: 'auto',
                    my: 2,
                    fontFamily: 'monospace',
                  }}
                >
                  {this.state.error.message}
                </Box>
              )}
            </Typography>
            <Button variant="contained" color="primary" onClick={this.handleReset} fullWidth>
              Return to Home
            </Button>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
