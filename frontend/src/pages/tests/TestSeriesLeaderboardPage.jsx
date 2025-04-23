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
  Tab,
  Tabs,
  Card,
  CardContent,
  alpha,
  useTheme
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import PeopleIcon from '@mui/icons-material/People';
import BarChartIcon from '@mui/icons-material/BarChart';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from '../../contexts/AuthContext';
import TestSeriesLeaderboard from '../../components/leaderboard/TestSeriesLeaderboard';
import { toast } from 'react-hot-toast';

const TestSeriesLeaderboardPage = () => {
  const { seriesId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const { user, api } = useAuth();
  const [testSeries, setTestSeries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState({
    participants: 0,
    averageScore: 0,
    completionRate: 0,
    averageTime: '0m'
  });

  // Fetch test series details
  useEffect(() => {
    const fetchTestSeriesDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch test series details
        const response = await api.get(`/api/test-series/${seriesId}`);
        
        if (response.data) {
          setTestSeries(response.data);
          
          // Try to get stats if available
          try {
            const statsResponse = await api.get(`/api/test-series/${seriesId}/stats`);
            if (statsResponse.data) {
              setStats(statsResponse.data);
            }
          } catch (statsErr) {
            console.warn('Stats API not implemented or failed:', statsErr);
          }
        }
      } catch (err) {
        console.error('Error fetching test series details:', err);
        setError('Failed to load test series details');
        toast.error('Could not load test series details');
      } finally {
        setLoading(false);
      }
    };

    if (seriesId) {
      fetchTestSeriesDetails();
    }
  }, [api, seriesId]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleBackToSeries = () => {
    navigate(`/test-series/${seriesId}`);
  };

  const handleBackToList = () => {
    navigate('/test-series');
  };

  if (loading) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !testSeries) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <Typography color="error" gutterBottom>{error || 'Test series not found'}</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleBackToList}
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
          {testSeries.title}
        </Link>
        <Typography color="text.primary">Leaderboard</Typography>
      </Breadcrumbs>

      {/* Series header with info */}
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
              src={testSeries.imageUrl}
              alt={testSeries.title}
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
              <AssignmentIcon fontSize="large" />
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                {testSeries.title}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                {testSeries.category}
              </Typography>
              <Box sx={{ display: 'flex', mt: 1 }}>
                <Chip 
                  icon={<AssignmentIcon fontSize="small" />}
                  label={`${testSeries.totalTests || 0} Tests`} 
                  size="small"
                  sx={{ mr: 1 }}
                />
                {testSeries.averageDuration && (
                  <Chip 
                    icon={<AccessTimeOutlinedIcon fontSize="small" />}
                    label={`${testSeries.averageDuration} mins`} 
                    size="small"
                    sx={{ mr: 1 }}
                  />
                )}
                <Chip 
                  icon={<PeopleIcon fontSize="small" />}
                  label={`${stats.participants} Participants`} 
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
                {stats.participants}
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
                Completion Rate
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                {stats.completionRate}%
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                color: theme.palette.text.secondary,
                mt: 1
              }}>
                <AssignmentIcon fontSize="small" sx={{ mr: 0.5 }} />
                <Typography variant="body2">
                  Tests completed
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

      {/* Leaderboard Tabs */}
      <Box sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          textColor="primary"
          indicatorColor="primary"
          aria-label="leaderboard tabs"
          sx={{ 
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '1rem'
            }
          }}
        >
          <Tab label="Overall Leaderboard" />
          {testSeries.tests && testSeries.tests.length > 0 && (
            <Tab label="Individual Tests" />
          )}
        </Tabs>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {activeTab === 0 && (
        <TestSeriesLeaderboard 
          seriesId={seriesId} 
          seriesTitle={testSeries.title}
        />
      )}

      {activeTab === 1 && testSeries.tests && testSeries.tests.length > 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Select a test to view its leaderboard:
          </Typography>
          
          <Grid container spacing={3}>
            {testSeries.tests.map((test, index) => (
              <Grid item xs={12} sm={6} md={4} key={test.id || index}>
                <Card 
                  sx={{ 
                    borderRadius: 2,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
                    }
                  }}
                  onClick={() => navigate(`/test-series/${seriesId}/test/${test.id}/leaderboard`)}
                >
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {test.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {test.description?.substring(0, 80)}
                      {test.description?.length > 80 ? '...' : ''}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      <Chip 
                        size="small"
                        icon={<AssignmentIcon fontSize="small" />}
                        label={`${test.questions?.length || 0} Questions`}
                      />
                      <Chip 
                        size="small"
                        icon={<AccessTimeOutlinedIcon fontSize="small" />}
                        label={`${test.duration || 0} mins`}
                      />
                      <Chip 
                        size="small"
                        icon={<PeopleIcon fontSize="small" />}
                        label={`${test.participantsCount || 0} Participants`}
                        color="primary"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Container>
  );
};

export default TestSeriesLeaderboardPage; 