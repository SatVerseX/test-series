import React from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Breadcrumbs,
  Link,
  useTheme,
  alpha
} from '@mui/material';
import Leaderboard from './Leaderboard';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { useNavigate } from 'react-router-dom';

const LeaderboardPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg">
      {/* Breadcrumbs navigation */}
      <Breadcrumbs 
        separator={<NavigateNextIcon fontSize="small" />} 
        aria-label="breadcrumb"
        sx={{ mb: 3 }}
      >
        <Link 
          color="inherit" 
          href="#" 
          onClick={(e) => {
            e.preventDefault();
            navigate('/');
          }}
          sx={{ 
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center' 
          }}
        >
          Home
        </Link>
        <Typography color="text.primary">Leaderboard</Typography>
      </Breadcrumbs>
      
      <Box sx={{ mb: 4 }}>
        <Paper
          elevation={3}
          sx={{ 
            p: 3, 
            borderRadius: 3,
            background: theme.palette.mode === 'dark' 
              ? `linear-gradient(145deg, ${alpha('#1E1E2E', 0.9)}, ${alpha('#1E1E2E', 0.7)})` 
              : `linear-gradient(145deg, #ffffff, ${alpha('#f8f9fa', 0.7)})`,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Global Leaderboard
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            See how you rank against other students across all tests and quizzes. Keep practicing and move up the rankings!
          </Typography>
        </Paper>
      </Box>
      
      <Leaderboard />
    </Container>
  );
};

export default LeaderboardPage; 