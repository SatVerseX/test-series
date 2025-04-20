import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Breadcrumbs,
  Link,
  Button,
  Divider,
  Grid,
  Avatar,
  Chip,
  CircularProgress,
  Card,
  CardContent,
  alpha,
  useTheme
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BarChartIcon from '@mui/icons-material/BarChart';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from '../../contexts/AuthContext';
import TestLeaderboard from '../../components/leaderboard/TestLeaderboard';
import { toast } from 'react-hot-toast';

const TestLeaderboardPage = () => {
  const { seriesId, testId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const { user, api } = useAuth();
  const [testData, setTestData] = useState(null);
  const [seriesData, setSeriesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    participantsCount: 0,
    averageScore: 0,
    averageAccuracy: 0,
    averageTime: '0m'
  });

  // Fetch test and series details
  useEffect(() => {
    const fetchTestDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch test details
        const testResponse = await api.get(`/api/test-series/${seriesId}/test/${testId}`);
        
        if (testResponse.data) {
          setTestData(testResponse.data);
          
          // Get test series info
          try {
            const seriesResponse = await api.get(`/api/test-series/${seriesId}`);
            if (seriesResponse.data) {
              setSeriesData(seriesResponse.data);
            }
          } catch (seriesErr) {
            console.warn('Could not fetch series details:', seriesErr);
          }
          
          // Try to get stats if available
          try {
            const statsResponse = await api.get(`/api/test-series/${seriesId}/test/${testId}/stats`);
            if (statsResponse.data) {
              setStats(statsResponse.data);
            }
          } catch (statsErr) {
            console.warn('Stats API not implemented or failed:', statsErr);
          }
        }
      } catch (err) {
        console.error('Error fetching test details:', err);
        setError('Failed to load test details');
        toast.error('Could not load test details');
      } finally {
        setLoading(false);
      }
    };

    if (seriesId && testId) {
      fetchTestDetails();
    }
  }, [api, seriesId, testId]);

  const handleBackToSeries = () => {
    navigate(`/test-series/${seriesId}`);
  };

  const handleBackToSeriesLeaderboard = () => {
    navigate(`/test-series/${seriesId}/leaderboard`);
  };

  if (loading) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !testData) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <Typography color="error" gutterBottom>{error || 'Test not found'}</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate(`/test-series/${seriesId}`)}
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
        >
          Back to Test Series
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
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
        <Link 
          color="inherit" 
          href="#" 
          onClick={(e) => {
            e.preventDefault();
            navigate('/test-series');
          }}
          sx={{ 
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center' 
          }}
        >
          Test Series
        </Link>
        <Link 
          color="inherit" 
          href="#" 
          onClick={(e) => {
            e.preventDefault();
            navigate(`/test-series/${seriesId}`);
          }}
          sx={{ 
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center' 
          }}
        >
          {seriesData?.title || 'Test Series'}
        </Link>
        <Link 
          color="inherit" 
          href="#" 
          onClick={(e) => {
            e.preventDefault();
            navigate(`/test-series/${seriesId}/leaderboard`);
          }}
          sx={{ 
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center' 
          }}
        >
          Leaderboard
        </Link>
        <Typography color="text.primary">{testData.title}</Typography>
      </Breadcrumbs>

      {/* Test header with info */}
      <Paper 
        elevation={3}
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 3,
          background: theme.palette.mode === 'dark' 
            ? `linear-gradient(145deg, ${alpha('#1E1E2E', 0.9)}, ${alpha('#1E1E2E', 0.7)})` 
            : `linear-gradient(145deg, #ffffff, ${alpha('#f8f9fa', 0.7)})`,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, md: 0 } }}>
            <Avatar 
              variant="rounded"
              sx={{ 
                width: 80, 
                height: 80, 
                mr: 2,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                bgcolor: theme.palette.primary.main,
                borderRadius: 2
              }}
            >
              <AssignmentTurnedInIcon fontSize="large" />
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                {testData.title}
              </Typography>
              {seriesData && (
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                  {seriesData.title}
                </Typography>
              )}
              <Box sx={{ display: 'flex', mt: 1 }}>
                <Chip 
                  icon={<AssignmentTurnedInIcon fontSize="small" />}
                  label={`${testData.questions?.length || 0} Questions`} 
                  size="small"
                  sx={{ mr: 1 }}
                />
                {testData.duration && (
                  <Chip 
                    icon={<AccessTimeOutlinedIcon fontSize="small" />}
                    label={`${testData.duration} mins`} 
                    size="small"
                    sx={{ mr: 1 }}
                  />
                )}
                <Chip 
                  icon={<PeopleIcon fontSize="small" />}
                  label={`${stats.participantsCount} Participants`} 
                  size="small"
                  color="primary"
                />
              </Box>
            </Box>
          </Box>
          <Box>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleBackToSeriesLeaderboard}
              startIcon={<ArrowBackIcon />}
              sx={{ borderRadius: 2, mr: 1 }}
            >
              Series Leaderboard
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleBackToSeries}
              startIcon={<ArrowBackIcon />}
              sx={{ borderRadius: 2 }}
            >
              Back to Series
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Performance Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 3,
            background: 'linear-gradient(145deg, rgba(76,175,80,0.08), rgba(139,195,74,0.03))',
            border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
            boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0 6px 20px rgba(0,0,0,0.1)'
            }
          }}>
            <CardContent>
              <Typography variant="overline" sx={{ color: theme.palette.text.secondary }}>
                Participants
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                {stats.participantsCount}
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                color: theme.palette.text.secondary,
                mt: 1
              }}>
                <PeopleIcon fontSize="small" sx={{ mr: 0.5 }} />
                <Typography variant="body2">
                  Active learners
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 3,
            background: 'linear-gradient(145deg, rgba(33,150,243,0.08), rgba(3,169,244,0.03))',
            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
            boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0 6px 20px rgba(0,0,0,0.1)'
            }
          }}>
            <CardContent>
              <Typography variant="overline" sx={{ color: theme.palette.text.secondary }}>
                Average Score
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                {stats.averageScore}
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                color: theme.palette.text.secondary,
                mt: 1
              }}>
                <BarChartIcon fontSize="small" sx={{ mr: 0.5 }} />
                <Typography variant="body2">
                  Points per test
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 3,
            background: 'linear-gradient(145deg, rgba(255,152,0,0.08), rgba(255,193,7,0.03))',
            border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
            boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0 6px 20px rgba(0,0,0,0.1)'
            }
          }}>
            <CardContent>
              <Typography variant="overline" sx={{ color: theme.palette.text.secondary }}>
                Average Accuracy
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                {stats.averageAccuracy}%
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                color: theme.palette.text.secondary,
                mt: 1
              }}>
                <CheckCircleIcon fontSize="small" sx={{ mr: 0.5 }} />
                <Typography variant="body2">
                  Correct answers
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 3,
            background: 'linear-gradient(145deg, rgba(63,81,181,0.08), rgba(103,58,183,0.03))',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0 6px 20px rgba(0,0,0,0.1)'
            }
          }}>
            <CardContent>
              <Typography variant="overline" sx={{ color: theme.palette.text.secondary }}>
                Average Time
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                {stats.averageTime}
              </Typography>
              <Box sx={{
                display: 'flex', 
                alignItems: 'center', 
                color: theme.palette.text.secondary,
                mt: 1
              }}>
                <AccessTimeOutlinedIcon fontSize="small" sx={{ mr: 0.5 }} />
                <Typography variant="body2">
                  Per test
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Test Leaderboard */}
      <TestLeaderboard 
        seriesId={seriesId} 
        testId={testId}
        testTitle={testData.title}
        testData={testData}
      />
    </Container>
  );
};

export default TestLeaderboardPage; 