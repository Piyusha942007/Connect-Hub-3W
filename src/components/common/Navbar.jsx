import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useThemeMode } from '../../context/ThemeModeContext';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Container from '@mui/material/Container';
import Badge from '@mui/material/Badge';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import { styled } from '@mui/material/styles';
import { getGradientForUsername } from '../../utils/helpers';
import { HubLogoIcon, BellIcon, SearchIcon, LogoutIcon, SunIcon, MoonIcon } from './CustomIcons';

const SearchContainer = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: 20,
  backgroundColor: theme.palette.mode === 'dark' ? '#0f172a' : '#f1f3f4',
  marginRight: theme.spacing(2),
  marginLeft: theme.spacing(2),
  width: '100%',
  maxWidth: 150,
  transition: 'all 0.25s ease-in-out',
  border: '1px solid transparent',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
    maxWidth: 240,
  },
  '&:focus-within': {
    backgroundColor: theme.palette.mode === 'dark' ? '#020617' : '#fff',
    borderColor: theme.palette.primary.main,
    boxShadow: `0 0 0 4px ${theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.15)' : 'rgba(25,118,210,.12)'}`,
    maxWidth: 300,
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 1.8),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#607d8b',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(0.8, 1, 0.8, 0),
    paddingLeft: `calc(1em + ${theme.spacing(3.5)})`,
    fontSize: '0.85rem',
  },
}));

const Navbar = ({ searchQuery, onSearchChange }) => {
  const { user, logout } = useAuth();
  const { mode, toggleThemeMode } = useThemeMode();

  return (
    <AppBar
      position="sticky"
      sx={{
        mb: 4,
        top: 0,
        zIndex: 1000,
        backgroundColor: mode === 'dark' ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(230, 235, 245, 0.8)',
        boxShadow: 'none',
        color: mode === 'dark' ? '#f8fafc' : '#2c3e50',
      }}
    >
      <Container maxWidth="md">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
          {/* Logo Brand */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HubLogoIcon size={28} />
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{
                fontWeight: 800,
                letterSpacing: '-0.5px',
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: { xs: 'none', sm: 'block' }
              }}
            >
              ConnectHub
            </Typography>
          </Box>

          {/* Search Field (only shown if handler provided, i.e., Home feed) */}
          {user && onSearchChange && (
            <SearchContainer>
              <SearchIconWrapper>
                <SearchIcon size={18} />
              </SearchIconWrapper>
              <StyledInputBase
                placeholder="Search posts, users..."
                value={searchQuery || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                inputProps={{ 'aria-label': 'search' }}
              />
            </SearchContainer>
          )}

          {/* User Profile / Actions */}
          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1.5 } }}>
              {/* Theme Mode Toggle */}
              <IconButton
                onClick={toggleThemeMode}
                color="inherit"
                size="medium"
                aria-label={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
                sx={{ color: 'text.secondary' }}
              >
                {mode === 'light' ? <MoonIcon size={20} /> : <SunIcon size={20} />}
              </IconButton>

              {/* Pulsing Notification Badge */}
              <IconButton aria-label="notifications" color="inherit" size="medium" sx={{ color: 'text.secondary' }}>
                <Badge
                  color="error"
                  variant="dot"
                  sx={{
                    '& .MuiBadge-badge': {
                      right: 2,
                      top: 2,
                    }
                  }}
                >
                  <BellIcon size={22} />
                </Badge>
              </IconButton>

              {/* Avatar Indicator */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  variant="dot"
                  sx={{
                    '& .MuiBadge-badge': {
                      backgroundColor: '#44b700',
                      color: '#44b700',
                      boxShadow: '0 0 0 2px #fff',
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      '&::after': {
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        animation: 'ripple 1.2s infinite ease-in-out',
                        border: '1px solid currentColor',
                        content: '""',
                      },
                    },
                    '@keyframes ripple': {
                      '0%': {
                        transform: 'scale(.8)',
                        opacity: 1,
                      },
                      '100%': {
                        transform: 'scale(2.4)',
                        opacity: 0,
                      },
                    },
                  }}
                >
                  <Avatar
                    sx={{
                      background: getGradientForUsername(user.username),
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      width: 36,
                      height: 36,
                      boxShadow: '0px 2px 8px rgba(25, 118, 210, 0.2)',
                      border: '2px solid #fff',
                    }}
                    alt={user.username}
                  >
                    {user.username ? user.username[0].toUpperCase() : 'U'}
                  </Avatar>
                </Badge>
                
                <Typography
                  variant="body2"
                  sx={{
                    display: { xs: 'none', md: 'block' },
                    fontWeight: 600,
                    color: 'text.primary',
                  }}
                >
                  {user.username}
                </Typography>
              </Box>

              <Button
                variant="outlined"
                color="primary"
                size="small"
                onClick={logout}
                startIcon={<LogoutIcon size={16} />}
                aria-label="Logout"
                sx={{
                  borderRadius: '20px',
                  px: 1.8,
                  py: 0.6,
                  fontWeight: 600,
                  fontSize: '0.8rem',
                }}
              >
                Logout
              </Button>
            </Box>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;
