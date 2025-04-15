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
} from '@mui/material';
import { Google as GoogleIcon, Email as EmailIcon } from '@mui/icons-material';

const Login = () => {
  const { signInWithGoogle, login, user, loading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom>
            Welcome to Testify
          </Typography>
          
          <Typography variant="body1" color="text.secondary" align="center">
            Sign in to access your personalized learning dashboard, take tests, and track your progress.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%' }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleEmailLogin} sx={{ width: '100%' }}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
            />
            <Button
              type="submit"
              variant="contained"
              startIcon={<EmailIcon />}
              fullWidth
              sx={{ mt: 2 }}
            >
              Sign in with Email
            </Button>
          </Box>

          <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Divider sx={{ flexGrow: 1 }} />
            <Typography variant="body2" color="text.secondary">
              OR
            </Typography>
            <Divider sx={{ flexGrow: 1 }} />
          </Box>

          <Button
            variant="outlined"
            onClick={handleGoogleLogin}
            fullWidth
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 2,
              py: 1.2,
              color: 'rgba(0, 0, 0, 0.87)',
              backgroundColor: '#fff',
              borderColor: 'rgba(0, 0, 0, 0.12)',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
              '&:hover': {
                backgroundColor: '#f8f9fa',
                borderColor: 'rgba(0, 0, 0, 0.2)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.12)'
              }
            }}
          >
            <Box
              component="img"
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google logo"
              sx={{ width: 20, height: 20 }}
            />
            <Typography sx={{ fontWeight: 500 }}>
              Sign in with Google
            </Typography>
          </Button>

          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
            <Link href="/forgot-password" variant="body2">
              Forgot Password?
            </Link>
            <Link href="/auth/register" variant="body2">
              Create Account
            </Link>
          </Box>

          <Typography variant="body2" color="text.secondary" align="center">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login; 