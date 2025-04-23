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
  const [subscribedSeries, setSubscribedSeries] = useState([]);
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
        
        // Fetch subscribed test series
        await fetchSubscribedSeries();
        
        // Fetch user test history (completed and in-progress tests)
        // Don't use cache busting for stats endpoint to avoid CORS issues
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
    } catch (error) {
      console.error('Error fetching purchased content:', error);
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

  const fetchSubscribedSeries = async () => {
    try {
      // Get user's subscribed test series
      const subscribedResponse = await api.get('/api/test-series/user/subscribed');
      
      if (subscribedResponse.data && subscribedResponse.data.length > 0) {
        setSubscribedSeries(subscribedResponse.data);
      } else {
        setSubscribedSeries([]);
      }
    } catch (error) {
      console.warn('Subscriptions API not implemented yet:', error);
      setSubscribedSeries([]);
      
      // Only show toast if there's an error other than API not existing yet
      if (error.response && error.response.status !== 404) {
        toast('Subscriptions API not fully implemented yet. Some features may be limited.', {
          icon: '⚠️',
          style: {
            borderRadius: '10px',
            background: '#FFF3CD',
            color: '#856404',
          },
        });
      }
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  // Check if user has any test series (purchased or subscribed)
  const hasTestSeries = purchasedSeries.length > 0 || subscribedSeries.length > 0;

  // Combine purchased and subscribed series for display
  const allUserSeries = [
    ...purchasedSeries.map(series => ({
      ...series,
      accessType: 'purchased'
    })),
    ...subscribedSeries.map(series => ({
      ...series,
      accessType: 'subscribed'
    }))
  ];

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
          <Tab label="TEST SERIES" icon={<AssignmentIcon />} iconPosition="start" />
          <Tab label="IN PROGRESS" icon={<PendingIcon />} iconPosition="start" />
          <Tab label="COMPLETED" icon={<CheckCircleIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Purchased and Subscribed Test Series */}
      {activeTab === 0 && (
        <>
          {!hasTestSeries ? (
            <Box 
              sx={{ 
                py: 8, 
                textAlign: 'center', 
                bgcolor: alpha(theme.palette.background.paper, 0.5), 
                borderRadius: 2 
              }}
            >
              <Typography variant="h6" color="text.secondary" gutterBottom>
                You haven't purchased or subscribed to any test series yet
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
              {allUserSeries.map((series, index) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                  <Card 
                    elevation={0}
                    sx={{ 
                      height: '100%',
                      borderRadius: 2.5,
                      overflow: 'hidden',
                      border: `1px solid ${series.accessType === 'purchased' 
                        ? theme.palette.secondary.main 
                        : theme.palette.info.main}`,
                      transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                      position: 'relative',
                      '&:before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundImage: series.accessType === 'purchased'
                          ? `linear-gradient(135deg, ${alpha(theme.palette.secondary.light, 0.05)}, ${alpha(theme.palette.secondary.dark, 0.05)})`
                          : `linear-gradient(135deg, ${alpha(theme.palette.info.light, 0.05)}, ${alpha(theme.palette.info.dark, 0.05)})`,
                        zIndex: 0
                      },
                      '&:hover': { 
                        transform: 'translateY(-6px)',
                        boxShadow: `0 12px 28px ${alpha(
                          series.accessType === 'purchased' 
                            ? theme.palette.secondary.main 
                            : theme.palette.info.main, 0.25)}`,
                      },
                      '&:after': {
                        content: '""',
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        width: '100%',
                        height: '3px',
                        background: series.accessType === 'purchased'
                          ? `linear-gradient(90deg, ${theme.palette.secondary.light}, ${theme.palette.secondary.dark})`
                          : `linear-gradient(90deg, ${theme.palette.info.light}, ${theme.palette.info.dark})`,
                        opacity: 0,
                        transition: 'opacity 0.3s ease',
                      },
                      '&:hover:after': {
                        opacity: 1
                      }
                    }}
                  >
                    <CardMedia
                      component="div"
                      sx={{
                        height: 120,
                        background: series.accessType === 'purchased' 
                          ? `linear-gradient(135deg, ${theme.palette.secondary.dark}, ${theme.palette.secondary.main})` 
                          : `linear-gradient(135deg, ${theme.palette.info.dark}, ${theme.palette.info.main})`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                        '&:after': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")',
                          opacity: 0.1,
                          zIndex: 1
                        }
                      }}
                    >
                      <Typography 
                        variant="h6" 
                        component="div" 
                        color="white" 
                        fontWeight="bold"
                        sx={{ 
                          zIndex: 2, 
                          textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                          px: 2,
                          textAlign: 'center'
                        }}
                      >
                        {series.title}
                      </Typography>
                      <Box 
                        sx={{ 
                          position: 'absolute', 
                          top: 8, 
                          right: 8, 
                          zIndex: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          background: 'rgba(255,255,255,0.2)',
                          backdropFilter: 'blur(4px)'
                        }}
                      >
                        {series.accessType === 'purchased' ? (
                          <AssignmentTurnedInIcon sx={{ fontSize: 14, color: 'white' }} />
                        ) : (
                          <AccessTimeIcon sx={{ fontSize: 14, color: 'white' }} />
                        )}
                      </Box>
                    </CardMedia>
                    <CardContent sx={{ position: 'relative', zIndex: 2, p: 1.5, pt: 2 }}>
                      <Box sx={{ mb: 1.5 }}>
                        <Chip 
                          label={series.category || 'General'} 
                          size="small" 
                          sx={{ 
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main,
                            fontWeight: 'medium',
                            px: 0.5,
                            height: 22,
                            fontSize: '0.7rem',
                            borderRadius: 4,
                            '& .MuiChip-label': {
                              px: 1
                            }
                          }} 
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1.5, gap: 0.5 }}>
                          <AssignmentIcon fontSize="small" sx={{ fontSize: 16 }} color="action" />
                          <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500 }} color="text.secondary">
                            {series.totalTests || 0} Tests
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, gap: 0.5 }}>
                          <AccessTimeIcon fontSize="small" sx={{ fontSize: 16 }} color="action" />
                          <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500 }} color="text.secondary">
                            Valid until: {series.expiresAt ? formatDate(series.expiresAt) : 'No expiration'}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ mt: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>Progress</Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 600 }} color={series.accessType === 'purchased' ? "secondary.main" : "info.main"}>
                            {series.progress?.completedTests || 0}/{series.totalTests || 0}
                          </Typography>
                        </Box>
                        <Box sx={{ position: 'relative', mt: 0.5 }}>
                          <Box 
                            sx={{ 
                              height: 6, 
                              borderRadius: 3,
                              width: '100%',
                              bgcolor: alpha(
                                series.accessType === 'purchased' 
                                  ? theme.palette.secondary.main 
                                  : theme.palette.info.main, 0.15),
                              position: 'relative',
                              overflow: 'hidden'
                            }}
                          >
                            <Box 
                              sx={{ 
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                height: '100%',
                                width: `${((series.progress?.completedTests || 0) / (series.totalTests || 1)) * 100}%`,
                                background: series.accessType === 'purchased'
                                  ? `linear-gradient(90deg, ${theme.palette.secondary.light}, ${theme.palette.secondary.main})`
                                  : `linear-gradient(90deg, ${theme.palette.info.light}, ${theme.palette.info.main})`,
                                borderRadius: 3,
                                transition: 'width 1s ease-in-out'
                              }}
                            />
                          </Box>
                        </Box>
                      </Box>
                      
                      {/* Display badge for access type */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
                        <Chip 
                          size="small"
                          label={series.accessType === 'purchased' ? "Purchased" : "Subscribed"} 
                          color={series.accessType === 'purchased' ? "secondary" : "info"}
                          sx={{ 
                            height: 22,
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            background: series.accessType === 'purchased'
                              ? `linear-gradient(90deg, ${alpha(theme.palette.secondary.light, 0.8)}, ${alpha(theme.palette.secondary.main, 0.8)})`
                              : `linear-gradient(90deg, ${alpha(theme.palette.info.light, 0.8)}, ${alpha(theme.palette.info.main, 0.8)})`,
                            color: 'white',
                            boxShadow: `0 2px 3px ${alpha(
                              series.accessType === 'purchased' 
                                ? theme.palette.secondary.main 
                                : theme.palette.info.main, 0.3)}`,
                            '& .MuiChip-label': {
                              textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                              px: 1
                            }
                          }}
                        />
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 0.5,
                            fontSize: '0.7rem',
                            fontWeight: 500
                          }}
                        >
                          {series.progress?.averageScore ? (
                            <>
                              <BarChartIcon sx={{ fontSize: 12 }} />
                              Avg. Score: {series.progress.averageScore}%
                            </>
                          ) : null}
                        </Typography>
                      </Box>
                    </CardContent>
                    <CardActions sx={{ px: 1.5, pb: 1.5, pt: 0, position: 'relative', zIndex: 2 }}>
                      <Button 
                        fullWidth 
                        variant="contained" 
                        color={series.accessType === 'purchased' ? "secondary" : "info"}
                        onClick={() => handleStartSeries(series._id)}
                        startIcon={<PlayArrowIcon sx={{ fontSize: 16 }} />}
                        sx={{
                          py: 0.5,
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          boxShadow: `0 2px 4px ${alpha(
                            series.accessType === 'purchased' 
                              ? theme.palette.secondary.main 
                              : theme.palette.info.main, 0.3)}`,
                          background: series.accessType === 'purchased'
                            ? `linear-gradient(90deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})`
                            : `linear-gradient(90deg, ${theme.palette.info.main}, ${theme.palette.info.dark})`,
                          '&:hover': {
                            background: series.accessType === 'purchased'
                              ? `linear-gradient(90deg, ${theme.palette.secondary.dark}, ${theme.palette.secondary.main})`
                              : `linear-gradient(90deg, ${theme.palette.info.dark}, ${theme.palette.info.main})`,
                            boxShadow: `0 4px 8px ${alpha(
                              series.accessType === 'purchased' 
                                ? theme.palette.secondary.main 
                                : theme.palette.info.main, 0.4)}`,
                          }
                        }}
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