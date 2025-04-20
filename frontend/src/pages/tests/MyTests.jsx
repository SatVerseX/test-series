import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Chip,
  Button,
  CircularProgress,
  Divider,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardActions,
  CardMedia,
  Avatar,
  useTheme,
  alpha,
  LinearProgress,
  Stack
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Schedule as ScheduleIcon,
  PlayArrow as PlayArrowIcon,
  RestartAlt as RestartAltIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  AssignmentLate as AssignmentLateIcon,
  BarChart as BarChartIcon,
  Timeline as TimelineIcon,
  CalendarToday as CalendarTodayIcon,
  Assignment as AssignmentIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';

const MyTests = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, api } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [purchasedSeries, setPurchasedSeries] = useState([]);
  const [testHistory, setTestHistory] = useState([]);
  const [testsInProgress, setTestsInProgress] = useState([]);
  const [activeTab, setActiveTab] = useState(0);

  // Fetch user test data
  useEffect(() => {
    const fetchUserTestData = async () => {
      if (!user || !api) return;
      
      setLoading(true);
      try {
        // Fetch purchased test series
        await fetchPurchasedSeries();
        
        // Fetch user test history (completed and in-progress tests)
        const statsResponse = await api.get(`/api/users/${user.firebaseId}/stats`);
        
        // Separate into completed and in-progress tests
        const allTests = statsResponse.data.recentTests || [];
        setTestHistory(allTests.filter(test => test.status === 'completed'));
        setTestsInProgress(allTests.filter(test => test.status === 'in_progress'));
        
        setError(null);
      } catch (err) {
        console.error('Error fetching test data:', err);
        setError('Failed to load your tests. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserTestData();
  }, [user, api]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handler for continuing a test
  const handleContinueTest = (testId) => {
    navigate(`/test-attempt/${testId}`);
  };

  // Handler for viewing test results
  const handleViewResults = (testId) => {
    navigate(`/test-results/${testId}/${user.firebaseId}`);
  };

  // Handler for starting a test series
  const handleStartSeries = (seriesId) => {
    navigate(`/test-series/${seriesId}`);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Get stat for a given category
  const getTestStatForCategory = (categoryName) => {
    const categoryTests = testHistory.filter(test => 
      test.category === categoryName || test.subject === categoryName
    );
    
    if (categoryTests.length === 0) return { count: 0, avgScore: 0 };
    
    const totalScore = categoryTests.reduce((sum, test) => sum + test.score, 0);
    const avgScore = totalScore / categoryTests.length;
    
    return {
      count: categoryTests.length,
      avgScore: Math.round(avgScore)
    };
  };

  const fetchPurchasedSeries = async () => {
    try {
      setLoading(true);
      
      // Get user's purchased test series - this API may not be implemented yet
      try {
        const seriesResponse = await api.get('/api/users/purchases/test-series');
        
        if (seriesResponse.data && seriesResponse.data.length > 0) {
          setPurchasedSeries(seriesResponse.data);
        } else {
          setPurchasedSeries([]);
        }
      } catch (seriesError) {
        console.warn('Series purchases API not implemented yet:', seriesError);
        setPurchasedSeries([]);
      }
      
      // Get user's individual test purchases - this API may not be implemented yet
      try {
        const testsResponse = await api.get('/api/users/purchases/tests');
        
        if (testsResponse.data && testsResponse.data.length > 0) {
          setPurchasedTests(testsResponse.data);
        } else {
          setPurchasedTests([]);
        }
      } catch (testsError) {
        console.warn('Test purchases API not implemented yet:', testsError);
        // If this variable is defined in the component, set it to empty array
        if (typeof setPurchasedTests === 'function') {
          setPurchasedTests([]);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching purchased content:', error);
      setLoading(false);
      toast('Purchases API not fully implemented yet. Some features may be limited.', {
        icon: '⚠️',
        style: {
          borderRadius: '10px',
          background: '#FFF3CD',
          color: '#856404',
        },
      });
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          My Tests
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Track your progress and manage your test series
        </Typography>
      </Box>

      {/* Error Display */}
      {error && (
        <Paper 
          elevation={0}
          sx={{ 
            p: 3, 
            mb: 4, 
            bgcolor: alpha(theme.palette.error.main, 0.1),
            border: `1px solid ${theme.palette.error.main}`,
            borderRadius: 2
          }}
        >
          <Typography color="error">{error}</Typography>
        </Paper>
      )}

      {/* Stats Overview */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.secondary.main, 0.05)})`
        }}
      >
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Your Test Overview
        </Typography>
        
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={4}>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                p: 2,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.1)
              }}
            >
              <Avatar 
                sx={{ 
                  bgcolor: theme.palette.primary.main,
                  width: 48,
                  height: 48,
                  mr: 2
                }}
              >
                <AssignmentTurnedInIcon />
              </Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Completed Tests
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {testHistory.length}
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                p: 2,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.warning.main, 0.1)
              }}
            >
              <Avatar 
                sx={{ 
                  bgcolor: theme.palette.warning.main,
                  width: 48,
                  height: 48,
                  mr: 2
                }}
              >
                <PendingIcon />
              </Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Tests in Progress
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {testsInProgress.length}
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                p: 2,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.success.main, 0.1)
              }}
            >
              <Avatar 
                sx={{ 
                  bgcolor: theme.palette.success.main,
                  width: 48,
                  height: 48,
                  mr: 2
                }}
              >
                <BarChartIcon />
              </Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Average Score
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {testHistory.length > 0 
                    ? `${Math.round(testHistory.reduce((sum, test) => sum + test.score, 0) / testHistory.length)}%` 
                    : 'N/A'}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs Navigation */}
      <Box sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Test Series" icon={<AssignmentIcon />} iconPosition="start" />
          <Tab label="In Progress" icon={<PendingIcon />} iconPosition="start" />
          <Tab label="Completed" icon={<CheckCircleIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Purchased Test Series */}
      {activeTab === 0 && (
        <>
          {purchasedSeries.length === 0 ? (
            <Box 
              sx={{ 
                py: 8, 
                textAlign: 'center', 
                bgcolor: alpha(theme.palette.background.paper, 0.5), 
                borderRadius: 2 
              }}
            >
              <Typography variant="h6" color="text.secondary" gutterBottom>
                You haven't purchased any test series yet
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => navigate('/test-series')}
                sx={{ mt: 2 }}
              >
                Browse Test Series
              </Button>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {purchasedSeries.map((series, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card 
                    elevation={0}
                    sx={{ 
                      height: '100%',
                      borderRadius: 2,
                      overflow: 'hidden',
                      border: `1px solid ${theme.palette.divider}`,
                      transition: 'all 0.3s ease',
                      '&:hover': { 
                        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
                        transform: 'translateY(-4px)'
                      }
                    }}
                  >
                    <CardMedia
                      component="div"
                      sx={{
                        height: 140,
                        bgcolor: `${alpha(theme.palette.primary.main, 0.7)}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Typography variant="h5" component="div" color="white" fontWeight="bold">
                        {series.title}
                      </Typography>
                    </CardMedia>
                    <CardContent>
                      <Box sx={{ mb: 2 }}>
                        <Chip 
                          label={series.category || 'General'} 
                          size="small" 
                          sx={{ 
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main,
                            fontWeight: 'medium'
                          }} 
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, gap: 0.5 }}>
                          <AssignmentIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {series.totalTests || 0} Tests
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 0.5 }}>
                          <AccessTimeIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            Valid until: {series.expiresAt ? formatDate(series.expiresAt) : 'No expiration'}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2">Progress</Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {series.progress?.completedTests || 0}/{series.totalTests || 0}
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={((series.progress?.completedTests || 0) / (series.totalTests || 1)) * 100}
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            bgcolor: alpha(theme.palette.primary.main, 0.1)
                          }}
                        />
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Button 
                        fullWidth 
                        variant="contained" 
                        color="primary"
                        onClick={() => handleStartSeries(series._id)}
                        startIcon={<PlayArrowIcon />}
                      >
                        Continue
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {/* Tests In Progress */}
      {activeTab === 1 && (
        <>
          {testsInProgress.length === 0 ? (
            <Box 
              sx={{ 
                py: 8, 
                textAlign: 'center', 
                bgcolor: alpha(theme.palette.background.paper, 0.5), 
                borderRadius: 2 
              }}
            >
              <Typography variant="h6" color="text.secondary" gutterBottom>
                You don't have any tests in progress
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => navigate('/tests')}
                sx={{ mt: 2 }}
              >
                Start a New Test
              </Button>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {testsInProgress.map((test, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card 
                    elevation={0}
                    sx={{ 
                      borderRadius: 2,
                      border: `1px solid ${theme.palette.divider}`,
                      overflow: 'hidden',
                      transition: 'all 0.3s ease',
                      '&:hover': { 
                        boxShadow: `0 4px 12px ${alpha(theme.palette.warning.main, 0.2)}`,
                        transform: 'translateY(-4px)' 
                      }
                    }}
                  >
                    <Box 
                      sx={{ 
                        p: 2, 
                        bgcolor: alpha(theme.palette.warning.main, 0.1),
                        borderBottom: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <PendingIcon color="warning" />
                        <Typography color="warning.main" fontWeight="medium">
                          In Progress
                        </Typography>
                      </Stack>
                    </Box>
                    <CardContent>
                      <Typography variant="h6" component="div" gutterBottom>
                        {test.title}
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarTodayIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            Started: {formatDate(test.startedAt)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <TimelineIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            Progress: {test.progressPercent || 0}% complete
                          </Typography>
                        </Box>
                      </Box>
                      {test.timeRemaining && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" color="warning.main" fontWeight="medium">
                            {test.timeRemaining} remaining
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                    <CardActions>
                      <Button 
                        fullWidth 
                        variant="contained" 
                        color="warning"
                        onClick={() => handleContinueTest(test.testId)}
                        startIcon={<PlayArrowIcon />}
                      >
                        Continue Test
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {/* Completed Tests */}
      {activeTab === 2 && (
        <>
          {testHistory.length === 0 ? (
            <Box 
              sx={{ 
                py: 8, 
                textAlign: 'center', 
                bgcolor: alpha(theme.palette.background.paper, 0.5), 
                borderRadius: 2 
              }}
            >
              <Typography variant="h6" color="text.secondary" gutterBottom>
                You haven't completed any tests yet
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => navigate('/tests')}
                sx={{ mt: 2 }}
              >
                Find Tests to Take
              </Button>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {testHistory.map((test, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card 
                    elevation={0}
                    sx={{ 
                      borderRadius: 2,
                      border: `1px solid ${theme.palette.divider}`,
                      overflow: 'hidden',
                      transition: 'all 0.3s ease',
                      '&:hover': { 
                        boxShadow: `0 4px 12px ${alpha(test.passed ? theme.palette.success.main : theme.palette.error.main, 0.2)}`,
                        transform: 'translateY(-4px)'
                      }
                    }}
                  >
                    <Box 
                      sx={{ 
                        p: 2, 
                        bgcolor: alpha(test.passed ? theme.palette.success.main : theme.palette.error.main, 0.1),
                        borderBottom: `1px solid ${alpha(test.passed ? theme.palette.success.main : theme.palette.error.main, 0.3)}`
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        {test.passed ? <CheckCircleIcon color="success" /> : <AssignmentLateIcon color="error" />}
                        <Typography color={test.passed ? "success.main" : "error.main"} fontWeight="medium">
                          {test.passed ? "Passed" : "Failed"}
                        </Typography>
                        <Box sx={{ ml: 'auto' }}>
                          <Chip 
                            label={`${test.score}%`} 
                            size="small"
                            sx={{ 
                              fontWeight: 'bold',
                              bgcolor: test.passed 
                                ? alpha(theme.palette.success.main, 0.2)
                                : alpha(theme.palette.error.main, 0.2),
                              color: test.passed 
                                ? theme.palette.success.dark
                                : theme.palette.error.dark
                            }}
                          />
                        </Box>
                      </Stack>
                    </Box>
                    <CardContent>
                      <Typography variant="h6" component="div" gutterBottom>
                        {test.title}
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarTodayIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            Completed: {formatDate(test.completedAt || test.updatedAt || test.createdAt)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <BarChartIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            Score: {test.score}% ({test.correctAnswers || 0}/{test.totalQuestions || 0})
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Button 
                        fullWidth 
                        variant="outlined" 
                        color={test.passed ? "success" : "error"}
                        onClick={() => handleViewResults(test.testId)}
                        startIcon={<AssignmentTurnedInIcon />}
                      >
                        View Results
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}
    </Container>
  );
};

export default MyTests; 