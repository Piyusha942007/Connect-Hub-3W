import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';

const LoginForm = () => {
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Validation states
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleDemoLogin = async (e) => {
    if (e) e.preventDefault();
    setApiError('');
    setErrors({});
    setSubmitting(true);
    
    const demoEmail = 'guest@example.com';
    const demoPassword = 'password123';
    const demoUsername = 'GuestUser';
    
    // Visually pre-fill
    setEmail(demoEmail);
    setPassword(demoPassword);
    
    try {
      // 1. Try logging in
      await login(demoEmail, demoPassword);
      navigate('/');
    } catch (err) {
      // 2. If it fails, automatically attempt to signup, then log in
      try {
        await signup(demoUsername, demoEmail, demoPassword);
        navigate('/');
      } catch (signupErr) {
        setApiError(signupErr.message || 'Demo Quick-Login failed. Please register manually.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Email format regex
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

  const validateForm = () => {
    const tempErrors = {};
    if (!email) {
      tempErrors.email = 'Email address is required';
    } else if (!emailRegex.test(email)) {
      tempErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      tempErrors.password = 'Password is required';
    } else if (password.length < 6) {
      tempErrors.password = 'Password must be at least 6 characters long';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/'); // Redirect to the Home feed page
    } catch (err) {
      setApiError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
      {apiError && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
          {apiError}
        </Alert>
      )}

      <TextField
        margin="normal"
        required
        fullWidth
        id="email"
        label="Email Address"
        name="email"
        autoComplete="email"
        autoFocus
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={!!errors.email}
        helperText={errors.email}
        disabled={submitting}
        aria-label="Email Address"
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <EmailIcon color="action" />
              </InputAdornment>
            ),
          },
        }}
      />

      <TextField
        margin="normal"
        required
        fullWidth
        name="password"
        label="Password"
        type={showPassword ? 'text' : 'password'}
        id="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={!!errors.password}
        helperText={errors.password}
        disabled={submitting}
        aria-label="Password"
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <LockIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />

      <Button
        type="submit"
        fullWidth
        variant="contained"
        size="large"
        disabled={submitting}
        sx={{ mt: 3, mb: 2, py: 1.5 }}
      >
        {submitting ? <CircularProgress size={26} color="inherit" /> : 'Log In'}
      </Button>

      <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
        <Box sx={{ flex: 1, height: '1px', backgroundColor: 'divider' }} />
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mx: 2, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}
        >
          Or Save Time
        </Typography>
        <Box sx={{ flex: 1, height: '1px', backgroundColor: 'divider' }} />
      </Box>

      <Button
        fullWidth
        variant="outlined"
        color="primary"
        size="large"
        onClick={handleDemoLogin}
        disabled={submitting}
        sx={{
          mb: 1,
          py: 1.2,
          fontWeight: 700,
          borderRadius: 2.5,
          borderWidth: '2px',
          textTransform: 'none',
          '&:hover': {
            borderWidth: '2px',
          },
        }}
      >
        ⚡ Quick Demo Login
      </Button>

      <Box sx={{ textAlignment: 'center', mt: 2, display: 'flex', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Don't have an account?{' '}
          <Link
            to="/signup"
            style={{
              textDecoration: 'none',
              color: '#1976d2',
              fontWeight: 600,
            }}
          >
            Sign Up
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default LoginForm;
