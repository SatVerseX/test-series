import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Box, Container, CircularProgress } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useState, useMemo } from 'react';

// Components
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import TestList from './pages/tests/TestList';
import TestAttempt from './pages/tests/TestAttempt';
import TestCreationPage from './pages/tests/testCreate';
import Profile from './pages/Profile';
import LibraryPage from './pages/Library';

import NotFound from './pages/NotFound';
import UserManagement from './pages/admin/UserManagement';
import Settings from './pages/admin/Settings';
import LeaderboardPage from './components/leaderboard/LeaderboardPage';
import ForgotPassword from './pages/ForgotPassword';




function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          width: '100vw',
        }}
      >
        <CircularProgress size={50} />
      </Box>
    );
  }

  // Check localStorage as fallback if user is null
  if (!user) {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        console.log('Protected route using stored user data');
        return children;
      } catch (error) {
        console.error('Error parsing stored user in ProtectedRoute:', error);
        return <Navigate to="/login" />;
      }
    }
    return <Navigate to="/login" />;
  }

  return children;
}

// Admin route component to ensure only admins can access certain routes
function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          width: '100vw',
        }}
      >
        <CircularProgress size={50} />
      </Box>
    );
  }

  // Check if user exists and has admin role
  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  return children;
}


function App() {
  const [mode, setMode] = useState('light');

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: '#1976d2',
            light: '#42a5f5',
            dark: '#1565c0',
          },
          secondary: {
            main: '#9c27b0',
            light: '#ba68c8',
            dark: '#7b1fa2',
          },
          background: {
            default: mode === 'light' ? '#f5f5f5' : '#121212',
            paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
          },
        },
        typography: {
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
          h1: {
            fontSize: '2.5rem',
            fontWeight: 600,
          },
          h2: {
            fontSize: '2rem',
            fontWeight: 600,
          },
          h3: {
            fontSize: '1.75rem',
            fontWeight: 600,
          },
          h4: {
            fontSize: '1.5rem',
            fontWeight: 600,
          },
          h5: {
            fontSize: '1.25rem',
            fontWeight: 600,
          },
          h6: {
            fontSize: '1rem',
            fontWeight: 600,
          },
        },
        shape: {
          borderRadius: 8,
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                borderRadius: 8,
                padding: '8px 16px',
                fontWeight: 500,
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                },
              },
              contained: {
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                },
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              },
            },
          },
          MuiTextField: {
            styleOverrides: {
              root: {
                '& .MuiOutlinedInput-root': {
                  borderRadius: 8,
                },
              },
            },
          },
        },
      }),
    [mode]
  );

  const toggleColorMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              minHeight: '100vh',
              width: '100%',
              bgcolor: 'background.default',
              transition: 'background-color 0.3s ease-in-out',
            }}
          >
            <Navbar toggleColorMode={toggleColorMode} mode={mode} />
            <Box
              component="main"
              sx={{
                flexGrow: 1,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                py: { xs: 2, sm: 3, md: 4 },
                px: { xs: 2, sm: 3, md: 4 },
                transition: 'all 0.3s ease-in-out',
              }}
            >
              <Container 
                maxWidth="xl" 
                sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: { xs: 2, sm: 3, md: 4 },
                }}
              >
                <Routes>
                  <Route path="/" element={<Home />} />
                  
                  <Route path="/login" element={<Login />} />
                  <Route path="/auth/register" element={<Register />} />
                 <Route path="/admin/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/tests" element={<ProtectedRoute><TestList /></ProtectedRoute>} />
                  <Route path="/test/:testId" element={<ProtectedRoute><TestAttempt /></ProtectedRoute>} />
                  <Route path="/test/create" element={<AdminRoute><TestCreationPage /></AdminRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="/Leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
                  <Route path="/admin" element={<AdminRoute><UserManagement /></AdminRoute>} />
                  <Route path="/admin/settings" element={<AdminRoute><Settings /></AdminRoute>} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/library" element={<ProtectedRoute><LibraryPage /></ProtectedRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Container>
            </Box>
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme={mode}
            />
          </Box>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
