import React from 'react';
import LoginForm from '../components/auth/LoginForm';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ForumIcon from '@mui/icons-material/Forum';

const Login = () => {
  return (
    <Container component="main" maxWidth="xs" sx={{ px: { xs: 1.5, sm: 3 } }}>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: { xs: 3, sm: 0 },
        }}
      >
        <Paper
          elevation={2}
          sx={{
            p: { xs: 3, sm: 4 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            borderRadius: { xs: 3, sm: 4 },
            backgroundColor: 'background.paper',
          }}
        >
          {/* Logo & Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'primary.light',
              color: 'primary.contrastText',
              borderRadius: '50%',
              p: 1.5,
              mb: 2,
              boxShadow: '0px 4px 12px rgba(25, 118, 210, 0.2)',
            }}
          >
            <ForumIcon sx={{ fontSize: 32 }} />
          </Box>
          
          <Typography variant="h5" component="h1" fontWeight="bold" color="text.primary">
            Welcome Back
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3, textAlign: 'center' }}>
            Log in to access your feed, like, and comment on posts.
          </Typography>

          <LoginForm />
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
