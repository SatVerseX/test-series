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

  useEffect(() => {
    const fetchSeriesDetails = async () => {
      try {
        const response = await api.get(`/api/test-series/${seriesId}`);
        setSeries(response.data);
        
        // Instead of trying to fetch progress from a non-existent endpoint,
        // let's create mock progress data for now
        if (user && response.data) {
          // Mock progress data based on the series
          const mockProgress = {
            completedTests: Math.floor(Math.random() * (response.data.totalTests || 0)),
            averageScore: Math.floor(Math.random() * 100)
          };
          setUserProgress(mockProgress);
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
    Math.round((userProgress.completedTests / series.totalTests) * 100) : 0;

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
              top: 20,
              left: 20,
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
            <Grid item xs={12}>
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
                    letterSpacing: '-0.5px'
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

                  {test.completed ? (
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
                        <Typography variant="body2" color="success.main">
                          Score: {test.score}%
                        </Typography>
                      </Box>
                    </Box>
                  ) : (
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
                          boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.2)}`
                        }
                      }}
                    >
                      {test.locked ? 'Locked' : 'Start Test'}
                    </Button>
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