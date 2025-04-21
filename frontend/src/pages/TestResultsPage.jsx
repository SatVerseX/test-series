import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  Container, Typography, Box, CircularProgress, Paper, Divider, Grid, Button, 
  Chip, useMediaQuery, useTheme, Avatar, IconButton, LinearProgress, Tooltip,
  SpeedDial, SpeedDialIcon, SpeedDialAction, Collapse, Card, CardContent
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import TimerIcon from '@mui/icons-material/Timer';
import StarIcon from '@mui/icons-material/Star';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ShareIcon from '@mui/icons-material/Share';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import TimelineIcon from '@mui/icons-material/Timeline';
import SpeedIcon from '@mui/icons-material/Speed';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { format } from 'date-fns';
import CountUp from 'react-countup';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

const TestResultsPage = () => {
  const { testId, userId } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [testData, setTestData] = useState(null);
  const [testAttempt, setTestAttempt] = useState(null);
  const [error, setError] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTestResults = async () => {
      setLoading(true);
      try {
        // First fetch the test data
        const testResponse = await api.get(`/api/tests/${testId}`);
        if (!testResponse.data) {
          throw new Error('Test not found');
        }
        setTestData(testResponse.data);

        // Then fetch the attempt data using the correct endpoint
        const attemptResponse = await api.get(`/api/tests/${testId}/attempts/${userId}`);
        if (!attemptResponse.data) {
          throw new Error('Test attempt not found');
        }
        setTestAttempt(attemptResponse.data);

        // Calculate score and check if passed
        const attempt = attemptResponse.data;
        const score = attempt.score || 0;
        const passingScore = testResponse.data.passingScore || 60;
        const isPassed = score >= passingScore;

        // Show confetti for passing scores
        if (isPassed && score >= 80) {
          setTimeout(() => {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 }
            });
          }, 1000);
        }

        // Update attempt status if needed
        if (attempt.isPassed !== isPassed) {
          await api.put(`/api/tests/${testId}/attempts/${userId}/update-status`, {
            status: 'completed',
            passed: isPassed
          });
        }

      } catch (err) {
        console.error('Error fetching test results:', err);
        setError(err.response?.data?.message || 'Failed to load test results. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (testId && userId) {
    fetchTestResults();
    }
  }, [testId, userId]);

  const getBadgeInfo = (score) => {
    if (score === 100) return { 
      title: 'Perfect Score! <span class="star-emoji">🌟</span>', 
      color: '#6c5ce7',
      gradient: 'linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%)',
      shadow: '0 10px 30px rgba(108, 92, 231, 0.4)',
      border: '2px solid rgba(108, 92, 231, 0.3)',
      textGradient: 'linear-gradient(to right, #a29bfe, #6c5ce7)',
      glow: '0 0 20px rgba(108, 92, 231, 0.6)'
    };
    if (score >= 80) return { 
      title: 'Excellent! 🌟', 
      color: '#00b894',
      gradient: 'linear-gradient(135deg, #55efc4 0%, #00b894 100%)',
      shadow: '0 10px 30px rgba(0, 184, 148, 0.3)',
      border: 'none',
      textGradient: null,
      glow: null
    };
    if (score >= 60) return { 
      title: 'Good Job! 👍', 
      color: '#0984e3',
      gradient: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)',
      shadow: '0 10px 30px rgba(9, 132, 227, 0.3)',
      border: 'none',
      textGradient: null,
      glow: null
    };
    return { 
      title: 'Keep Practicing! 💪', 
      color: '#fdcb6e',
      gradient: 'linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)',
      shadow: '0 10px 30px rgba(253, 203, 110, 0.3)',
      border: 'none',
      textGradient: null,
      glow: null
    };
  };

  // Helper function to get color scheme based on section and score
  const getColorScheme = (section, score) => {
    // Achievement Badge Section - Purple Theme
    if (section === 'badge') {
      if (score === 100) return {
        primary: theme.palette.mode === 'dark' ? '#a29bfe' : '#6c5ce7',
        secondary: theme.palette.mode === 'dark' ? '#6c5ce7' : '#a29bfe',
        light: theme.palette.mode === 'dark' ? 'rgba(162, 155, 254, 0.2)' : 'rgba(108, 92, 231, 0.1)',
        medium: theme.palette.mode === 'dark' ? 'rgba(162, 155, 254, 0.3)' : 'rgba(108, 92, 231, 0.3)',
        gradient: theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)'
          : 'linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%)'
      };
      if (score >= 80) return {
        primary: theme.palette.mode === 'dark' ? '#55efc4' : '#00b894',
        secondary: theme.palette.mode === 'dark' ? '#00b894' : '#55efc4',
        light: theme.palette.mode === 'dark' ? 'rgba(85, 239, 196, 0.2)' : 'rgba(0, 184, 148, 0.1)',
        medium: theme.palette.mode === 'dark' ? 'rgba(85, 239, 196, 0.3)' : 'rgba(0, 184, 148, 0.3)',
        gradient: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #00b894 0%, #55efc4 100%)'
          : 'linear-gradient(135deg, #55efc4 0%, #00b894 100%)'
      };
      if (score >= 60) return {
        primary: theme.palette.mode === 'dark' ? '#74b9ff' : '#0984e3',
        secondary: theme.palette.mode === 'dark' ? '#0984e3' : '#74b9ff',
        light: theme.palette.mode === 'dark' ? 'rgba(116, 185, 255, 0.2)' : 'rgba(9, 132, 227, 0.1)',
        medium: theme.palette.mode === 'dark' ? 'rgba(116, 185, 255, 0.3)' : 'rgba(9, 132, 227, 0.3)',
        gradient: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #0984e3 0%, #74b9ff 100%)'
          : 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)'
      };
      return {
        primary: theme.palette.mode === 'dark' ? '#ffeaa7' : '#fdcb6e',
        secondary: theme.palette.mode === 'dark' ? '#fdcb6e' : '#ffeaa7',
        light: theme.palette.mode === 'dark' ? 'rgba(255, 234, 167, 0.2)' : 'rgba(253, 203, 110, 0.1)',
        medium: theme.palette.mode === 'dark' ? 'rgba(255, 234, 167, 0.3)' : 'rgba(253, 203, 110, 0.3)',
        gradient: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #fdcb6e 0%, #ffeaa7 100%)'
          : 'linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)'
      };
    }

    // Performance Stats Section - Blue Theme
    if (section === 'stats') {
      return {
        primary: theme.palette.mode === 'dark' ? '#81ecec' : '#00cec9',
        secondary: theme.palette.mode === 'dark' ? '#00cec9' : '#81ecec',
        light: theme.palette.mode === 'dark' ? 'rgba(129, 236, 236, 0.2)' : 'rgba(0, 206, 201, 0.1)',
        medium: theme.palette.mode === 'dark' ? 'rgba(129, 236, 236, 0.3)' : 'rgba(0, 206, 201, 0.3)',
        gradient: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #00cec9 0%, #81ecec 100%)'
          : 'linear-gradient(135deg, #81ecec 0%, #00cec9 100%)'
      };
    }

    // Time Analysis Section - Green Theme
    if (section === 'time') {
      return {
        primary: theme.palette.mode === 'dark' ? '#55efc4' : '#00b894',
        secondary: theme.palette.mode === 'dark' ? '#00b894' : '#55efc4',
        light: theme.palette.mode === 'dark' ? 'rgba(85, 239, 196, 0.2)' : 'rgba(0, 184, 148, 0.1)',
        medium: theme.palette.mode === 'dark' ? 'rgba(85, 239, 196, 0.3)' : 'rgba(0, 184, 148, 0.3)',
        gradient: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #00b894 0%, #55efc4 100%)'
          : 'linear-gradient(135deg, #55efc4 0%, #00b894 100%)'
      };
    }

    // Study Recommendations Section - Orange Theme
    if (section === 'recommendations') {
      return {
        primary: theme.palette.mode === 'dark' ? '#fab1a0' : '#e17055',
        secondary: theme.palette.mode === 'dark' ? '#e17055' : '#fab1a0',
        light: theme.palette.mode === 'dark' ? 'rgba(250, 177, 160, 0.2)' : 'rgba(225, 112, 85, 0.1)',
        medium: theme.palette.mode === 'dark' ? 'rgba(250, 177, 160, 0.3)' : 'rgba(225, 112, 85, 0.3)',
        gradient: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #e17055 0%, #fab1a0 100%)'
          : 'linear-gradient(135deg, #fab1a0 0%, #e17055 100%)'
      };
    }

    // Test Summary Section - Pink Theme
    if (section === 'summary') {
      return {
        primary: theme.palette.mode === 'dark' ? '#fd79a8' : '#e84393',
        secondary: theme.palette.mode === 'dark' ? '#e84393' : '#fd79a8',
        light: theme.palette.mode === 'dark' ? 'rgba(253, 121, 168, 0.2)' : 'rgba(232, 67, 147, 0.1)',
        medium: theme.palette.mode === 'dark' ? 'rgba(253, 121, 168, 0.3)' : 'rgba(232, 67, 147, 0.3)',
        gradient: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #e84393 0%, #fd79a8 100%)'
          : 'linear-gradient(135deg, #fd79a8 0%, #e84393 100%)'
      };
    }

    // Question Review Section - Indigo Theme
    if (section === 'review') {
      return {
        primary: theme.palette.mode === 'dark' ? '#a29bfe' : '#6c5ce7',
        secondary: theme.palette.mode === 'dark' ? '#6c5ce7' : '#a29bfe',
        light: theme.palette.mode === 'dark' ? 'rgba(162, 155, 254, 0.2)' : 'rgba(108, 92, 231, 0.1)',
        medium: theme.palette.mode === 'dark' ? 'rgba(162, 155, 254, 0.3)' : 'rgba(108, 92, 231, 0.3)',
        gradient: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)'
          : 'linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%)'
      };
    }

    // Default Theme
    return {
      primary: theme.palette.mode === 'dark' ? '#74b9ff' : '#0984e3',
      secondary: theme.palette.mode === 'dark' ? '#0984e3' : '#74b9ff',
      light: theme.palette.mode === 'dark' ? 'rgba(116, 185, 255, 0.2)' : 'rgba(9, 132, 227, 0.1)',
      medium: theme.palette.mode === 'dark' ? 'rgba(116, 185, 255, 0.3)' : 'rgba(9, 132, 227, 0.3)',
      gradient: theme.palette.mode === 'dark'
        ? 'linear-gradient(135deg, #0984e3 0%, #74b9ff 100%)'
        : 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)'
    };
  };

  const shareResult = (platform) => {
    const message = `I scored ${percentage}% on my ${testData.title} test!`;
    const url = window.location.href;

    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${message}`);
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${message}&url=${url}`);
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${message} ${url}`);
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`);
        break;
      default:
        break;
    }
  };

  // Helper function to check if an answer is correct
  const isAnswerCorrect = (question, userAnswer) => {
    if (!userAnswer) return false;
    
    // Handle different question types
    switch (question.type) {
      case 'mcq':
      case 'multiple_choice':
      return userAnswer === question.correctAnswer;
      case 'multiple_select':
        const correctAnswers = question.correctAnswer.split(',');
        const userAnswers = userAnswer.split(',');
        return correctAnswers.length === userAnswers.length && 
               correctAnswers.every(ans => userAnswers.includes(ans));
      case 'trueFalse':
        return userAnswer.toLowerCase() === question.correctAnswer.toLowerCase();
      default:
    return userAnswer === question.correctAnswer;
    }
  };

  // Helper function to determine score color
  const getScoreColor = (score) => {
    if (score >= 80) return theme.palette.success.main;
    if (score >= 60) return theme.palette.success.main;
    if (score >= 40) return theme.palette.warning.main;
    return theme.palette.error.main;
  };
  
  // Helper function to get background color for score display
  const getScoreBackgroundColor = (score) => {
    if (score >= 80) return theme.palette.success.light;
    if (score >= 60) return theme.palette.success.light; // lighter green
    if (score >= 40) return theme.palette.warning.light;
    return theme.palette.error.light;
  };

  // Add these styles to the beginning of the component function
  React.useEffect(() => {
    // Add keyframes to document
    const styleSheet = document.createElement('style');
    styleSheet.type = 'text/css';
    styleSheet.innerText = `
      @keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.1); opacity: 0.7; }
        100% { transform: scale(1); opacity: 1; }
      }
      
      @keyframes shimmer {
        0% { opacity: 1; }
        50% { opacity: 0.8; }
        100% { opacity: 1; }
      }
    `;
    document.head.appendChild(styleSheet);

    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  // Add this style to the component
  const styles = {
    starEmoji: {
      color: theme.palette.mode === 'dark' ? '#FFD700' : '#FFA500',
      display: 'inline-block',
      fontSize: '1.2em',
      verticalAlign: 'middle',
      marginLeft: '4px',
      textShadow: theme.palette.mode === 'dark' 
        ? '0 0 8px rgba(255, 215, 0, 0.8)'
        : '0 0 4px rgba(255, 165, 0, 0.6)'
    }
  };

  // Add new premium styles
  const premiumStyles = {
    gradientText: {
      background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      fontWeight: 'bold'
    },
    glassCard: {
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'
    },
    scoreCircle: {
      position: 'relative',
      width: '200px',
      height: '200px',
      margin: '0 auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '50%',
      background: 'conic-gradient(from 0deg, var(--score-color) var(--score-percent), transparent var(--score-percent))',
      animation: 'rotate 2s ease-out forwards'
    },
    statCard: {
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)'
      }
    }
  };

  if (loading) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading test results...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
        <Button 
          variant="contained" 
          onClick={() => navigate('/tests')} 
          sx={{ mt: 2 }}
        >
          Back to Tests
        </Button>
      </Container>
    );
  }

  if (!testData || !testAttempt) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <Typography>No test results found.</Typography>
        <Button 
          variant="contained" 
          onClick={() => navigate('/tests')} 
          sx={{ mt: 2 }}
        >
          Back to Tests
        </Button>
      </Container>
    );
  }

  const score = testAttempt.score || 0;
  const correctAnswers = testAttempt.correctAnswers || 0;
  const totalQuestions = testData.questions?.length || 0;
  const timeTaken = testAttempt.timeTaken || 0;
  const averageTimePerQuestion = totalQuestions ? Math.round(timeTaken / totalQuestions) : 0;
  const completionSpeed = averageTimePerQuestion > 180 ? 'Slow' : averageTimePerQuestion > 90 ? 'Moderate' : 'Fast';

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper 
          elevation={3} 
          sx={{ 
            ...premiumStyles.glassCard,
            p: 4,
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(66, 66, 66, 0.9), rgba(33, 33, 33, 0.95))'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(240, 240, 240, 0.9))'
          }}
        >
              <Typography 
            variant="h3" 
            gutterBottom 
            align="center" 
            sx={premiumStyles.gradientText}
          >
            {testData.title}
          </Typography>

          {/* Animated Score Circle */}
          <Box 
                  sx={{
              ...premiumStyles.scoreCircle,
              '--score-color': getScoreColor(score),
              '--score-percent': `${score}%`
            }}
          >
            <Typography variant="h2" sx={premiumStyles.gradientText}>
                    <CountUp 
                end={score} 
                      suffix="%" 
                duration={2.5} 
                decimals={1}
                    />
                  </Typography>
                </Box>

          {/* Achievement Badge */}
          <Box sx={{ textAlign: 'center', my: 4 }}>
              <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <Chip
                icon={testAttempt.isPassed ? <EmojiEventsIcon /> : <StarIcon />}
                label={testAttempt.isPassed ? 'Achievement Unlocked! 🏆' : 'Keep Going! 💪'}
                    sx={{ 
                  p: 3,
                  fontSize: '1.2rem',
                  background: testAttempt.isPassed 
                    ? 'linear-gradient(45deg, #00b894, #00cec9)'
                    : 'linear-gradient(45deg, #fdcb6e, #e17055)',
                  color: 'white',
                  '& .MuiChip-icon': {
                    color: 'white'
                  }
                }}
              />
              </motion.div>
                </Box>

          {/* Stats Grid with Animation */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {[
              {
                title: 'Correct Answers',
                value: `${correctAnswers}/${totalQuestions}`,
                icon: <CheckCircleIcon />,
                color: '#00b894'
              },
              {
                title: 'Time Taken',
                value: `${Math.floor(timeTaken / 60)}m ${timeTaken % 60}s`,
                icon: <TimerIcon />,
                color: '#0984e3'
              },
              {
                title: 'Avg. Time/Question',
                value: `${averageTimePerQuestion}s`,
                icon: <SpeedIcon />,
                color: '#6c5ce7'
              },
              {
                title: 'Completion Speed',
                value: completionSpeed,
                icon: <TrendingUpIcon />,
                color: '#e84393'
              }
            ].map((stat, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card 
                    sx={{ 
                      ...premiumStyles.glassCard,
                      ...premiumStyles.statCard
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar sx={{ bgcolor: stat.color }}>
                          {stat.icon}
                  </Avatar>
                        <Typography variant="h6" sx={{ ml: 1 }}>
                          {stat.title}
                  </Typography>
                </Box>
                      <Typography variant="h4" sx={{ color: stat.color }}>
                        {stat.value}
                      </Typography>
                    </CardContent>
                  </Card>
              </motion.div>
            </Grid>
            ))}
          </Grid>

          {/* Action Buttons with Hover Effects */}
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 3 }}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                variant="contained" 
                onClick={() => navigate(`/tests/${testId}/review`)}
                startIcon={<MenuBookIcon />}
                sx={{ 
                  background: 'linear-gradient(45deg, #00b894, #00cec9)',
                  px: 4,
                  py: 1.5,
                  borderRadius: '12px',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #00cec9, #00b894)'
                  }
                }}
              >
                Review Test
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
                variant="outlined" 
                onClick={() => navigate('/tests')}
                startIcon={<TimelineIcon />}
              sx={{ 
                  px: 4,
                py: 1.5,
                  borderRadius: '12px',
                  borderWidth: '2px'
                }}
              >
                Back to Tests
            </Button>
          </motion.div>
        </Box>

          {/* Share Results SpeedDial */}
          <SpeedDial
            ariaLabel="Share Results"
            sx={{ position: 'fixed', bottom: 16, right: 16 }}
            icon={<ShareIcon />}
          >
            {[
              { icon: <FacebookIcon />, name: 'Facebook', action: () => shareResult('facebook') },
              { icon: <TwitterIcon />, name: 'Twitter', action: () => shareResult('twitter') },
              { icon: <WhatsAppIcon />, name: 'WhatsApp', action: () => shareResult('whatsapp') },
              { icon: <LinkedInIcon />, name: 'LinkedIn', action: () => shareResult('linkedin') }
            ].map((action) => (
              <SpeedDialAction
                key={action.name}
                icon={action.icon}
                tooltipTitle={action.name}
                onClick={action.action}
              />
            ))}
          </SpeedDial>
        </Paper>
      </motion.div>
    </Container>
  );
};

export default TestResultsPage; 