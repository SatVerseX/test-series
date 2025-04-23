import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  LinearProgress,
  Stack,
  IconButton,
  Paper,
  alpha,
  useTheme,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Timer as TimerIcon,
  Assignment as AssignmentIcon,
  Star as StarIcon,
  People as PeopleIcon,
  PlayArrow as PlayArrowIcon,
  Lock as LockIcon,
  CheckCircle as CheckCircleIcon,
  EmojiEvents as TrophyIcon,
  ArrowBack as ArrowBackIcon,
  BarChart as BarChartIcon,
  Lightbulb as LightbulbIcon,
  Timeline as TimelineIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const TestSeriesDetail = () => {
  const theme = useTheme();
  const { seriesId } = useParams();
  const navigate = useNavigate();
  const { user, api } = useAuth();
  const [series, setSeries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProgress, setUserProgress] = useState(null);
  const [activeTest, setActiveTest] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [testCompletionStatus, setTestCompletionStatus] = useState({});

  useEffect(() => {
    const fetchSeriesDetails = async () => {
      try {
        const response = await api.get(`/api/test-series/${seriesId}`);
        setSeries(response.data);
        
        // Fetch completion status for each test if user is logged in
        if (user && response.data.tests) {
          const completionStatus = {};
          await Promise.all(response.data.tests.map(async (test) => {
            try {
              const statusResponse = await api.get(`/api/tests/${test._id}/check-completion`);
              completionStatus[test._id] = {
                hasCompleted: statusResponse.data.hasCompleted === true,
                score: statusResponse.data.score,
                totalMarks: statusResponse.data.totalMarks,
                completedAt: statusResponse.data.completedAt,
                percentageScore: statusResponse.data.percentageScore
              };
            } catch (error) {
              console.error(`Error checking completion status for test ${test._id}:`, error);
              completionStatus[test._id] = { hasCompleted: false };
            }
          }));
          setTestCompletionStatus(completionStatus);

          // Calculate real progress data
          const completedTests = response.data.tests.filter(test => 
            completionStatus[test._id]?.hasCompleted === true &&
            completionStatus[test._id]?.score !== undefined &&
            completionStatus[test._id]?.score !== null &&
            completionStatus[test._id]?.completedAt
          ).length;

          setUserProgress({
            completedTests,
            totalTests: response.data.tests.length,
            progress: completedTests / response.data.tests.length * 100
          });
        }

        // Check if user is subscribed to this series
        if (user) {
          try {
            const subscriptionResponse = await api.get(`/api/users/subscribed/test-series/${seriesId}`);
            setIsSubscribed(subscriptionResponse.data.isSubscribed);
          } catch (subscriptionError) {
            console.error('Error checking subscription status:', subscriptionError);
          }
        }
      } catch (error) {
        console.error('Error fetching series details:', error);
        toast.error('Failed to load test series details');
      } finally {
        setLoading(false);
      }
    };

    fetchSeriesDetails();
  }, [seriesId, api, user]);

  const handleStartTest = (testId) => {
    navigate(`/test-attempt/${testId}`);
  };

  const handleViewLeaderboard = () => {
    navigate(`/test-series/${seriesId}/leaderboard`);
  };

  const handleViewResult = (testId, attemptId) => {
    navigate(`/test-results/${testId}/attempt/${attemptId}`);
  };

  const handleSubscribe = async () => {
    if (!user) {
      toast.error('Please login to subscribe to this test series');
      navigate('/login');
      return;
    }

    setSubscribing(true);
    try {
      const response = await api.post(`/api/users/subscribe/test-series/${seriesId}`);
      
      if (response.data.isSubscribed) {
        setIsSubscribed(true);
        toast.success('Successfully subscribed to test series!');
      }
    } catch (error) {
      console.error('Error subscribing to test series:', error);
      if (error.response?.status === 409) {
        // Already subscribed
        setIsSubscribed(true);
        toast.info('You are already subscribed to this test series');
      } else {
        toast.error('Failed to subscribe to test series');
      }
    } finally {
      setSubscribing(false);
    }
  };

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '70vh',
          flexDirection: 'column',
          gap: 2
        }}
      >
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" color="text.secondary">
          Loading Test Series...
        </Typography>
      </Box>
    );
  }

  if (!series) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h5">Test series not found</Typography>
      </Box>
    );
  }

  const progressPercentage = userProgress ? 
    Math.round((userProgress.completedTests / (userProgress.totalTests || 1)) * 100) : 0;

  return (
    <Container maxWidth="xl">
      {/* Hero Section */}
      <Paper
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 4,
          mb: 4,
          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
          boxShadow: `0 20px 80px ${alpha(theme.palette.primary.main, 0.3)}`,
        }}
      >
        {/* Animated Background Pattern */}
        <Box
          component={motion.div}
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
            backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")',
            filter: 'blur(1px)',
          }}
        />
        
        <Box sx={{ position: 'relative', p: { xs: 3, md: 6 } }}>
          <IconButton
            component={motion.button}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            sx={{
              position: 'absolute',
              top: { xs: 10, md: 20 },
              left: { xs: 10, md: 20 },
              color: 'white',
              bgcolor: alpha('#fff', 0.15),
              backdropFilter: 'blur(10px)',
              '&:hover': { 
                bgcolor: alpha('#fff', 0.25),
                transform: 'translateY(-2px)',
                boxShadow: `0 8px 20px ${alpha('#000', 0.2)}`
              },
              transition: 'all 0.3s ease'
            }}
          >
            <ArrowBackIcon />
          </IconButton>

          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} sx={{ pl: { xs: 7, md: 3 } }}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Typography
                  variant="h3"
                  color="white"
                  gutterBottom
                  sx={{
                    fontWeight: 800,
                    textShadow: '0 2px 15px rgba(0,0,0,0.3)',
                    mb: 2,
                    letterSpacing: '-0.5px',
                    fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem' },
                    ml: { xs: '10px', md: 0 },
                    paddingLeft: { xs: '10px', md: 0 },
                    paddingTop: { xs: 1, md: 0 }
                  }}
                >
                  {series.title}
                </Typography>

                <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                  {[
                    { icon: <StarIcon />, label: `${series.rating || 4.5} Rating` },
                    { icon: <PeopleIcon />, label: `${series.students || 0} Students` },
                    { icon: <AssignmentIcon />, label: `${series.totalTests || 0} Tests` }
                  ].map((item, index) => (
                    <Chip
                      key={index}
                      icon={item.icon}
                      label={item.label}
                      component={motion.div}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      sx={{
                        bgcolor: alpha('#fff', 0.15),
                        color: 'white',
                        backdropFilter: 'blur(10px)',
                        '& .MuiChip-icon': { color: 'white' },
                        border: '1px solid',
                        borderColor: alpha('#fff', 0.2),
                        '&:hover': {
                          bgcolor: alpha('#fff', 0.25),
                          transform: 'translateY(-2px)',
                          boxShadow: `0 8px 20px ${alpha('#000', 0.2)}`
                        },
                        transition: 'all 0.3s ease'
                      }}
                    />
                  ))}
                </Stack>

                <Typography
                  variant="body1"
                  color="white"
                  sx={{
                    opacity: 0.9,
                    maxWidth: 800,
                    lineHeight: 1.8,
                    fontSize: '1.1rem',
                    textShadow: '0 2px 10px rgba(0,0,0,0.2)'
                  }}
                >
                  {series.description}
                </Typography>
              </motion.div>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Progress and Actions Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {userProgress && (
          <Grid item xs={12} md={8}>
            <Card
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              sx={{
                borderRadius: 4,
                background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.7)})`,
                backdropFilter: 'blur(10px)',
                border: '1px solid',
                borderColor: alpha(theme.palette.primary.main, 0.1),
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <TimelineIcon sx={{ color: theme.palette.primary.main, mr: 1, fontSize: 28 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Your Progress
                  </Typography>
                </Box>
                <Box sx={{ position: 'relative', mb: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={progressPercentage}
                    sx={{
                      height: 12,
                      borderRadius: 6,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 6,
                        backgroundImage: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                      }
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      position: 'absolute',
                      right: 0,
                      top: -20,
                      fontWeight: 600,
                      color: theme.palette.primary.main
                    }}
                  >
                    {progressPercentage}%
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {userProgress.completedTests} of {series.totalTests} tests completed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        <Grid item xs={12} md={userProgress ? 4 : 12}>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              size="large"
              startIcon={<BarChartIcon />}
              onClick={handleViewLeaderboard}
              component={motion.button}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              fullWidth
              sx={{
                py: 2,
                borderWidth: 2,
                borderRadius: 3,
                fontSize: '1.1rem',
                fontWeight: 600,
                background: alpha(theme.palette.background.paper, 0.8),
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  borderWidth: 2,
                  transform: 'translateY(-2px)',
                  boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.2)}`,
                  background: alpha(theme.palette.background.paper, 0.9)
                }
              }}
            >
              View Leaderboard
            </Button>
          </Stack>
        </Grid>
      </Grid>

      {/* Tests List */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h5" 
          sx={{ 
            mb: 3, 
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <LightbulbIcon sx={{ color: theme.palette.primary.main }} />
          Available Tests
        </Typography>

        <Grid container spacing={3}>
          {series.tests?.map((test, index) => (
            <Grid item xs={12} md={6} lg={4} key={test._id || index}>
              <Card
                component={motion.div}
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: 1, 
                  y: 0, 
                  transition: { delay: index * 0.1 } 
                }}
                whileHover={{ 
                  y: -8,
                  transition: { duration: 0.2 }
                }}
                onMouseEnter={() => setActiveTest(test._id)}
                onMouseLeave={() => setActiveTest(null)}
                sx={{
                  height: '100%',
                  borderRadius: 4,
                  transition: 'all 0.3s ease',
                  border: '1px solid',
                  borderColor: alpha(theme.palette.primary.main, 0.1),
                  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.7)})`,
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.2)}`
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: activeTest === test._id ? 
                          theme.palette.primary.main : 
                          alpha(theme.palette.primary.main, 0.1),
                        color: activeTest === test._id ? 
                          'white' : 
                          theme.palette.primary.main,
                        width: 56,
                        height: 56,
                        mr: 2,
                        transition: 'all 0.3s ease',
                        fontWeight: 700,
                        fontSize: '1.2rem'
                      }}
                    >
                      {index + 1}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                        {test.title}
                      </Typography>
                      <Stack direction="row" spacing={3}>
                        <Tooltip title="Test Duration" arrow>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              '&:hover': { color: theme.palette.primary.main }
                            }}
                          >
                            <TimerIcon sx={{ fontSize: 18, mr: 0.5 }} />
                            {test.duration} mins
                          </Typography>
                        </Tooltip>
                        <Tooltip title="Total Questions" arrow>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              '&:hover': { color: theme.palette.primary.main }
                            }}
                          >
                            <AssignmentIcon sx={{ fontSize: 18, mr: 0.5 }} />
                            {test.totalQuestions || test.questions?.length || 0} Questions
                          </Typography>
                        </Tooltip>
                      </Stack>
                    </Box>
                  </Box>

                  {testCompletionStatus[test._id]?.hasCompleted ? (
                    <>
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          mt: 2,
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette.success.main, 0.1)
                        }}
                      >
                        <CheckCircleIcon sx={{ color: theme.palette.success.main, mr: 1 }} />
                        <Box>
                          <Typography color="success.main" sx={{ fontWeight: 600 }}>
                            Completed
                          </Typography>
                          <Stack direction="row" spacing={2}>
                            <Typography variant="body2" color="success.main">
                              Score: {testCompletionStatus[test._id]?.score || 0}/{testCompletionStatus[test._id]?.totalMarks || 0}
                            </Typography>
                            <Typography variant="body2" color="success.main">
                              ({testCompletionStatus[test._id]?.percentageScore || 0}%)
                            </Typography>
                          </Stack>
                        </Box>
                      </Box>
                      <Button
                        fullWidth
                        variant="outlined"
                        color="success"
                        onClick={() => handleViewResult(test._id, testCompletionStatus[test._id].attemptId)}
                        startIcon={<CheckCircleIcon />}
                        component={motion.button}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        sx={{
                          mt: 2,
                          borderRadius: 3,
                          textTransform: 'none',
                          py: 1.5,
                          borderWidth: 2,
                          fontSize: '1rem',
                          fontWeight: 600,
                          '&:hover': {
                            borderWidth: 2,
                            transform: 'translateY(-2px)',
                            boxShadow: `0 8px 20px ${alpha(theme.palette.success.main, 0.2)}`
                          }
                        }}
                      >
                        View Result
                      </Button>
                    </>
                  ) : (
                    <Stack spacing={2} sx={{ mt: 2 }}>
                      {isSubscribed ? (
                        <Button
                          fullWidth
                          variant="outlined"
                          color="primary"
                          onClick={() => handleStartTest(test._id)}
                          startIcon={test.locked ? <LockIcon /> : <PlayArrowIcon />}
                          disabled={test.locked}
                          component={motion.button}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          sx={{
                            borderRadius: 3,
                            textTransform: 'none',
                            py: 1.5,
                            borderWidth: 2,
                            fontSize: '1rem',
                            fontWeight: 600,
                            '&:hover': {
                              borderWidth: 2,
                              transform: 'translateY(-2px)',
                              boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.2)}`
                            }
                          }}
                        >
                          {test.locked ? 'Locked' : 'Start Test'}
                        </Button>
                      ) : null}

                      {!isSubscribed ? (
                        <Button
                          fullWidth
                          variant="contained"
                          color="success"
                          onClick={handleSubscribe}
                          disabled={subscribing}
                          startIcon={<StarIcon />}
                          component={motion.button}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          sx={{
                            borderRadius: 3,
                            textTransform: 'none',
                            py: 1.5,
                            fontSize: '1rem',
                            fontWeight: 600,
                            background: `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: `0 8px 20px ${alpha(theme.palette.success.main, 0.3)}`
                            }
                          }}
                        >
                          {subscribing ? 'Subscribing...' : 'Subscribe to Start Test'}
                        </Button>
                      ) : (
                        <Button
                          fullWidth
                          variant="contained"
                          color="success"
                          startIcon={<CheckCircleIcon />}
                          disabled
                          sx={{
                            borderRadius: 3,
                            textTransform: 'none',
                            py: 1.5,
                            fontSize: '1rem',
                            fontWeight: 600,
                            background: alpha(theme.palette.success.main, 0.9),
                            '&:hover': {
                              background: alpha(theme.palette.success.main, 0.9)
                            }
                          }}
                        >
                          Subscribed
                        </Button>
                      )}
                    </Stack>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
};

export default TestSeriesDetail; 