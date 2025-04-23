import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
  TextField,
  Divider,
  Link,
  useTheme,
  alpha,
  Avatar,
  useMediaQuery,
} from '@mui/material';
import { 
  Google as GoogleIcon, 
  Email as EmailIcon, 
  LockOutlined, 
  School,
  Brightness4 as MoonIcon,
  StarOutline as StarIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

// Animated particles component
const BackgroundParticles = () => {
  const theme = useTheme();
  return (
    <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', zIndex: 0 }}>
      {[...Array(20)].map((_, index) => (
        <Box
          key={index}
          component={motion.div}
          sx={{
            position: 'absolute',
            width: Math.random() * 10 + 5,
            height: Math.random() * 10 + 5,
            borderRadius: '50%',
            backgroundColor: theme.palette.mode === 'dark' 
              ? 'rgba(255,255,255,0.05)' 
              : 'rgba(0,0,0,0.03)',
            filter: 'blur(1px)',
          }}
          animate={{
            x: [Math.random() * 100, Math.random() * window.innerWidth],
            y: [Math.random() * 100, Math.random() * window.innerHeight],
            opacity: [0.1, 0.4, 0.1]
          }}
          transition={{
            duration: Math.random() * 20 + 15,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </Box>
  );
};

const Login = () => {
  const { signInWithGoogle, login, user, loading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isDarkMode = theme.palette.mode === 'dark';

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await login(email, password);
    } catch (error) {
      console.error('Email login error:', error);
      setError('Failed to sign in. Please check your credentials.');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      await signInWithGoogle();
    } catch (error) {
      console.error('Google login error:', error);
      setError('Failed to sign in with Google. Please try again.');
    }
  };

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        sx={{
          background: isDarkMode ? theme.palette.background.default : '#f8f9fa',
        }}
      >
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.2, 1],
          }}
          transition={{ 
            rotate: { duration: 2, repeat: Infinity, ease: "linear" },
            scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          <CircularProgress 
            sx={{ 
              color: theme.palette.primary.main,
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round',
              }
            }} 
            size={60}
            thickness={4}
          />
        </motion.div>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: isDarkMode
          ? theme.palette.background.default
          : '#f8f9fa',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: { xs: 2, md: 4 },
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: isDarkMode
            ? "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath opacity='.5' d='M96 95h4v1h-4v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9zm-1 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
            : "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.03'%3E%3Cpath opacity='.5' d='M96 95h4v1h-4v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9zm-1 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
        }
      }}
    >
      <BackgroundParticles />
      <Container 
        maxWidth="sm" 
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        sx={{ position: 'relative', zIndex: 2 }}
      >
        <Paper
          elevation={24}
          sx={{
            borderRadius: 4,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            backdropFilter: isDarkMode ? 'blur(10px)' : 'blur(20px)',
            background: isDarkMode
              ? alpha(theme.palette.background.paper, 0.6)
              : alpha(theme.palette.background.paper, 0.85),
            boxShadow: isDarkMode
              ? '0 10px 40px rgba(0,0,0,0.3), 0 0 20px rgba(0,0,0,0.2), inset 0 0 0 1px rgba(255,255,255,0.05)'
              : '0 10px 40px rgba(0,0,0,0.15), 0 0 20px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(255,255,255,0.1)',
            position: 'relative',
          }}
        >
          {/* Shine effect */}
          <Box
            component={motion.div}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '200%',
              background: isDarkMode
                ? 'linear-gradient(to bottom right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.03) 75%, rgba(255,255,255,0) 100%)'
                : 'linear-gradient(to bottom right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%, rgba(255,255,255,0) 100%)',
              transform: 'translateY(-80%) rotate(25deg)',
              transformOrigin: 'top left',
              zIndex: 1,
            }}
            animate={{
              translateY: ['30%', '-80%'],
            }}
            transition={{
              duration: 2.5,
              ease: "easeInOut",
              repeat: Infinity,
              repeatDelay: 7,
            }}
          />

          <Box
            sx={{
              position: 'relative',
              background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
              py: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: 'white',
              borderBottom: isDarkMode 
                ? '1px solid rgba(255,255,255,0.05)' 
                : '1px solid rgba(255,255,255,0.1)',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: isDarkMode
                  ? "url(\"data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1' fill-rule='evenodd'%3E%3Cpath d='M5 0h1L0 5v1H0V0h5z'/%3E%3C/g%3E%3C/svg%3E\")"
                  : "url(\"data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.15' fill-rule='evenodd'%3E%3Cpath d='M5 0h1L0 5v1H0V0h5z'/%3E%3C/g%3E%3C/svg%3E\")",
                opacity: isDarkMode ? 0.3 : 0.5,
              }
            }}
          >
            <Box
              component={motion.div}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                mb: 1,
                position: 'relative',
                zIndex: 2,
              }}
              initial={{ scale: 0.8, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: 'white',
                  boxShadow: isDarkMode 
                    ? '0 0 20px rgba(0,0,0,0.4)' 
                    : '0 0 20px rgba(0,0,0,0.2)',
                  border: isDarkMode
                    ? '2px solid rgba(255,255,255,0.5)'
                    : '2px solid rgba(255,255,255,0.8)',
                }}
              >
                <School sx={{ color: theme.palette.primary.main, fontSize: 30 }} />
              </Avatar>
              <Box>
                <Typography
                  variant="h4"
                  component="h1"
                  sx={{
                    fontWeight: 700,
                    letterSpacing: 1,
                    textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                  }}
                >
                  VIDYA
                </Typography>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontStyle: 'italic',
                    opacity: 0.9,
                    textShadow: '0 1px 5px rgba(0,0,0,0.3)',
                  }}
                >
                  या विद्या या विमुक्तये
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ p: 4 }}>
            <Typography
              variant="h6"
              component="h2"
              align="center"
              fontWeight="600"
              sx={{ 
                mb: 1,
                color: theme.palette.text.primary,
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: -8,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '40px',
                  height: '3px',
                  borderRadius: '2px',
                  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                }
              }}
            >
              Sign in to your account
            </Typography>

            {error && (
              <Alert 
                severity="error" 
                variant="filled"
                sx={{ 
                  width: '100%',
                  borderRadius: 2,
                  animation: 'fadeIn 0.5s',
                  boxShadow: '0 4px 12px rgba(211, 47, 47, 0.2)'
                }}
              >
                {error}
              </Alert>
            )}

            <Box 
              component="form" 
              onSubmit={handleEmailLogin} 
              sx={{ width: '100%' }}
            >
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
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <EmailIcon 
                      sx={{ 
                        color: theme.palette.text.secondary,
                        mr: 1 
                      }} 
                    />
                  ),
                }}
                sx={{
                  mt: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: isDarkMode
                      ? alpha(theme.palette.divider, 0.7)
                      : theme.palette.divider,
                  },
                }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <LockOutlined 
                      sx={{ 
                        color: theme.palette.text.secondary,
                        mr: 1,
                      }} 
                    />
                  ),
                }}
                sx={{
                  mt: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: isDarkMode
                      ? alpha(theme.palette.divider, 0.7)
                      : theme.palette.divider,
                  },
                }}
              />

              <Box sx={{ textAlign: 'right', mt: 1, mb: 2 }}>
                <Link 
                  href="#" 
                  variant="body2"
                  sx={{ 
                    color: theme.palette.primary.main,
                    fontWeight: 500,
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    } 
                  }}
                >
                  Forgot Password?
                </Link>
              </Box>

              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{ 
                  mt: 2, 
                  mb: 1, 
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1.05rem',
                  letterSpacing: 0.5,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  boxShadow: isDarkMode
                    ? `0 8px 20px ${alpha(theme.palette.primary.dark, 0.6)}`
                    : `0 8px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                  '&:hover': {
                    boxShadow: isDarkMode
                      ? `0 10px 25px ${alpha(theme.palette.primary.dark, 0.8)}`
                      : `0 10px 25px ${alpha(theme.palette.primary.main, 0.6)}`,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 10%, ${theme.palette.primary.dark} 90%)`,
                  }
                }}
                component={motion.button}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Sign in
              </Button>
            </Box>

            <Box 
              sx={{ 
                width: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2,
                px: 2
              }}
            >
              <Divider sx={{ 
                flexGrow: 1,
                borderColor: isDarkMode
                  ? alpha(theme.palette.divider, 0.3)
                  : alpha(theme.palette.divider, 0.6)
              }} />
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  letterSpacing: 1
                }}
              >
                or
              </Typography>
              <Divider sx={{ 
                flexGrow: 1,
                borderColor: isDarkMode
                  ? alpha(theme.palette.divider, 0.3)
                  : alpha(theme.palette.divider, 0.6)
              }} />
            </Box>

            <Button
              onClick={handleGoogleLogin}
              variant="outlined"
              fullWidth
              sx={{ 
                mt: 3,
                py: 1.2,
                px: 2,
                height: 46,
                borderRadius: 2,
                borderWidth: 1,
                borderColor: isDarkMode 
                  ? 'rgba(255,255,255,0.16)'
                  : 'rgba(0,0,0,0.12)',
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.9rem',
                fontFamily: 'Roboto, "Segoe UI", Arial, sans-serif',
                letterSpacing: '0.2px',
                color: isDarkMode ? '#ffffff' : 'rgba(0,0,0,0.87)',
                background: isDarkMode
                  ? 'rgba(66,133,244,0.08)'
                  : '#ffffff',
                boxShadow: isDarkMode
                  ? '0 2px 4px rgba(0,0,0,0.2)'
                  : '0 1px 1px rgba(0,0,0,0.12)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                transition: 'all 0.3s ease',
                position: 'relative',
                '&:hover': {
                  borderColor: isDarkMode 
                    ? 'rgba(255,255,255,0.3)'
                    : 'rgba(66,133,244,0.5)',
                  background: isDarkMode
                    ? 'rgba(66,133,244,0.12)'
                    : '#f5f5f5',
                  boxShadow: isDarkMode
                    ? '0 2px 6px rgba(0,0,0,0.3)'
                    : '0 1px 3px rgba(66,133,244,0.3)'
                }
              }}
              component={motion.button}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              <Box
                sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  justifyContent: 'center'
                }}
              >
                <Box
                  component="img"
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google logo"
                  sx={{ 
                    width: 18, 
                    height: 18, 
                    mr: 2,
                    objectFit: 'contain'
                  }}
                />
                <Typography
                  sx={{
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    color: isDarkMode ? '#ffffff' : 'rgba(0,0,0,0.87)'
                  }}
                >
                  Sign in with Google
                </Typography>
              </Box>
            </Button>

            <Box 
              sx={{ 
                mt: 4, 
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: 1
              }}
            >
              <Typography 
                variant="body2" 
                color="text.secondary"
              >
                Don't have an account?
              </Typography>
              <Link 
                href="/auth/register"
                underline="none"
                sx={{ 
                  color: theme.palette.primary.main,
                  fontWeight: 600,
                  '&:hover': {
                    textDecoration: 'underline',
                  }
                }}
              >
                Create Account
              </Link>
            </Box>
          </Box>

          <Box 
            sx={{ 
              p: 2, 
              textAlign: 'center', 
              borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : theme.palette.divider}`,
              bgcolor: isDarkMode ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.01)'
            }}
          >
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ fontSize: '0.75rem' }}
            >
              By signing in, you agree to our Terms of Service and Privacy Policy
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login; 