import React from 'react';
import SignupForm from '../components/auth/SignupForm';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ForumIcon from '@mui/icons-material/Forum';

const Signup = () => {
  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          minHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: 3,
        }}
      >
        <Paper
          elevation={2}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            borderRadius: 4,
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
            Create Account
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3, textAlign: 'center' }}>
            Sign up to share posts, like, and comment with our community.
          </Typography>

          <SignupForm />
        </Paper>
      </Box>
    </Container>
  );
};

export default Signup;
