import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  Container, Typography, Box, CircularProgress, Paper, Divider, Grid, Button, 
  Chip, useMediaQuery, useTheme, Avatar, IconButton, LinearProgress, Tooltip,
  SpeedDial, SpeedDialIcon, SpeedDialAction, Collapse
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
        const testResponse = await api.get(`/api/tests/${testId}`);
        setTestData(testResponse.data);

        const attemptResponse = await api.get(`/api/tests/${testId}/attempts/${userId}`);
        setTestAttempt(attemptResponse.data);

        // Calculate if the test should be passed based on percentage
        const correctAnswers = testResponse.data.questions.filter(q => {
          const userAnswer = attemptResponse.data.answers[q._id];
          return isAnswerCorrect(q, userAnswer);
        }).length;
        
        const totalQuestions = testResponse.data.questions.length;
        const percentageScore = (correctAnswers / totalQuestions) * 100;
        const passingScore = testResponse.data.passingScore || 60; // Use test's passing score or default to 60%
        
        // Update the test attempt if the passed status is incorrect
        if ((percentageScore >= passingScore) !== attemptResponse.data.passed) {
          await api.put(`/api/tests/${testId}/attempts/${userId}/update-status`, {
            passed: percentageScore >= passingScore
          });
        }

        // Trigger confetti for high scores
        if (percentageScore >= 80) {
          setTimeout(() => {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 }
            });
          }, 1000);
        }
      } catch (err) {
        console.error('Error fetching test results:', err);
        setError('Failed to load test results. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTestResults();
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

  // Helper function to determine if an answer is correct
  const isAnswerCorrect = (question, userAnswer) => {
    if (userAnswer === null || userAnswer === undefined) return false;
    
    if (question.type === 'mcq' || question.type === 'trueFalse') {
      return userAnswer === question.correctAnswer;
    } else if (question.type === 'shortAnswer') {
      return userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
    } else if (question.type === 'integer') {
      return parseInt(userAnswer) === parseInt(question.correctAnswer);
    }
    // Default comparison
    return userAnswer === question.correctAnswer;
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

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography color="error" variant="h5" align="center">
          {error}
        </Typography>
      </Container>
    );
  }

  if (!testData || !testAttempt) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography variant="h5" align="center">
          Test results not found.
        </Typography>
      </Container>
    );
  }

  const { title, subject, questions } = testData;
  const { answers, completedAt, updatedAt, createdAt } = testAttempt;
  
  const correctAnswers = questions.filter(q => isAnswerCorrect(q, answers[q._id])).length;
  const totalQuestions = questions.length;
  const incorrectAnswers = totalQuestions - correctAnswers;
  const percentage = (correctAnswers / totalQuestions) * 100;
  
  const submissionDate = completedAt || updatedAt || createdAt;
  const formattedDate = submissionDate 
    ? format(new Date(submissionDate), 'PPpp') 
    : 'Not available';

  const badgeInfo = getBadgeInfo(percentage);
  const badgeColorScheme = getColorScheme('badge', percentage);
  const statsColorScheme = getColorScheme('stats', percentage);
  const timeColorScheme = getColorScheme('time', percentage);
  const recommendationsColorScheme = getColorScheme('recommendations', percentage);
  const summaryColorScheme = getColorScheme('summary', percentage);
  const reviewColorScheme = getColorScheme('review', percentage);
  const averageTimePerQuestion = Math.round((new Date(completedAt) - new Date(createdAt)) / (totalQuestions * 1000));

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Achievement Badge */}
        <Paper 
          elevation={3} 
          sx={{ 
            p: { xs: 2, md: 4 }, 
            mb: 4, 
            borderRadius: 3,
            background: theme.palette.mode === 'dark'
              ? `linear-gradient(135deg, ${badgeColorScheme.light} 0%, ${theme.palette.background.paper} 100%)`
              : `linear-gradient(135deg, ${badgeColorScheme.light} 0%, #ffffff 100%)`,
            boxShadow: `0 10px 40px ${badgeColorScheme.medium}`,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 2,
              mb: 3
            }}>
              <Avatar 
                sx={{ 
                  width: percentage === 100 ? 100 : 80, 
                  height: percentage === 100 ? 100 : 80,
                  background: badgeColorScheme.gradient,
                  boxShadow: badgeColorScheme.shadow,
                  border: badgeColorScheme.border,
                  position: 'relative',
                  '&::after': percentage === 100 ? {
                    content: '""',
                    position: 'absolute',
                    top: -5,
                    left: -5,
                    right: -5,
                    bottom: -5,
                    borderRadius: '50%',
                    background: 'transparent',
                    border: '2px solid rgba(255, 255, 255, 0.5)',
                    animation: 'pulse 2s infinite'
                  } : {}
                }}
              >
                <EmojiEventsIcon sx={{ 
                  fontSize: percentage === 100 ? 50 : 40,
                  color: percentage === 100 ? '#FFFFFF' : 'inherit',
                  filter: percentage === 100 ? 'drop-shadow(0 0 5px rgba(255, 255, 255, 0.6))' : 'none'
                }} />
              </Avatar>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 'bold',
                  color: badgeColorScheme.primary,
                  textAlign: 'center',
                  ...(badgeInfo.textGradient && {
                    background: badgeInfo.textGradient,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 2px 5px rgba(0, 0, 0, 0.2)'
                  }),
                  ...(badgeInfo.glow && {
                    textShadow: badgeInfo.glow
                  }),
                  animation: percentage === 100 ? 'shimmer 2s infinite' : 'none',
                  '& .star-emoji': styles.starEmoji
                }}
                dangerouslySetInnerHTML={{ __html: badgeInfo.title }}
              />
            </Box>
          </motion.div>

          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <Box sx={{ 
                position: 'relative',
                width: 250,
                height: 250,
                margin: 'auto'
              }}>
                <CircularProgress
                  variant="determinate"
                  value={100}
                  size={250}
                  thickness={4}
                  sx={{
                    color: theme.palette.grey[200],
                    position: 'absolute',
                    top: 0,
                    left: 0
                  }}
                />
                <motion.div
                  initial={{ strokeDashoffset: 100 }}
                  animate={{ strokeDashoffset: 100 - percentage }}
                  transition={{ duration: 2, ease: "easeOut" }}
                >
                  <CircularProgress
                    variant="determinate"
                    value={percentage}
                    size={250}
                    thickness={4}
                    sx={{
                      color: badgeColorScheme.primary,
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      '& .MuiCircularProgress-circle': {
                        strokeLinecap: 'round',
                      }
                    }}
                  />
                </motion.div>
                <Box sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Typography variant="h2" sx={{ 
                    fontWeight: 'bold',
                    color: badgeColorScheme.primary
                  }}>
                    <CountUp 
                      end={percentage} 
                      duration={2} 
                      suffix="%" 
                      decimals={0}
                    />
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                    {correctAnswers}/{totalQuestions} points
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={8}>
              <Grid container spacing={2}>
                {/* Performance Stats */}
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ 
                    p: 2, 
                    borderRadius: 2,
                    background: theme.palette.mode === 'dark'
                      ? `linear-gradient(135deg, ${statsColorScheme.light} 0%, ${theme.palette.background.paper} 100%)`
                      : `linear-gradient(135deg, ${statsColorScheme.light} 0%, #ffffff 100%)`,
                    height: '100%',
                    border: `1px solid ${statsColorScheme.light}`
                  }}>
                    <Typography variant="h6" gutterBottom sx={{ color: statsColorScheme.primary }}>
                      Correct Answers
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircleIcon sx={{ color: statsColorScheme.primary }} />
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: statsColorScheme.primary }}>
                        <CountUp end={correctAnswers} duration={2} />
                      </Typography>
                      <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                        / {totalQuestions}
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={(correctAnswers/totalQuestions) * 100}
                      sx={{ 
                        mt: 1,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: statsColorScheme.light,
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: statsColorScheme.primary
                        }
                      }}
                    />
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Paper sx={{ 
                    p: 2, 
                    borderRadius: 2,
                    background: theme.palette.mode === 'dark'
                      ? `linear-gradient(135deg, ${statsColorScheme.light} 0%, ${theme.palette.background.paper} 100%)`
                      : `linear-gradient(135deg, ${statsColorScheme.light} 0%, #ffffff 100%)`,
                    height: '100%',
                    border: `1px solid ${statsColorScheme.light}`
                  }}>
                    <Typography variant="h6" gutterBottom sx={{ color: statsColorScheme.primary }}>
                      Incorrect Answers
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CancelIcon sx={{ color: statsColorScheme.primary }} />
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: statsColorScheme.primary }}>
                        <CountUp end={incorrectAnswers} duration={2} />
                      </Typography>
                      <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                        / {totalQuestions}
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={(incorrectAnswers/totalQuestions) * 100}
                      sx={{ 
                        mt: 1,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: statsColorScheme.light,
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: statsColorScheme.primary
                        }
                      }}
                    />
                  </Paper>
                </Grid>

                {/* Time Analysis */}
                <Grid item xs={12}>
                  <Paper sx={{ 
                    p: 2, 
                    borderRadius: 2,
                    background: theme.palette.mode === 'dark'
                      ? `linear-gradient(135deg, ${timeColorScheme.light} 0%, ${theme.palette.background.paper} 100%)`
                      : `linear-gradient(135deg, ${timeColorScheme.light} 0%, #ffffff 100%)`,
                    border: `1px solid ${timeColorScheme.light}`
                  }}>
                    <Typography variant="h6" gutterBottom sx={{ color: timeColorScheme.primary }}>
                      Time Analysis
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <TimerIcon sx={{ color: timeColorScheme.primary, fontSize: 32, mb: 1 }} />
                          <Typography variant="body2" color="text.secondary">
                            Average Time per Question
                          </Typography>
                          <Typography variant="h6" sx={{ color: timeColorScheme.primary, fontWeight: 'bold' }}>
                            {averageTimePerQuestion} sec
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <SpeedIcon sx={{ color: timeColorScheme.primary, fontSize: 32, mb: 1 }} />
                          <Typography variant="body2" color="text.secondary">
                            Completion Speed
                          </Typography>
                          <Typography variant="h6" sx={{ color: timeColorScheme.primary, fontWeight: 'bold' }}>
                            {averageTimePerQuestion < 30 ? 'Fast' : averageTimePerQuestion < 60 ? 'Average' : 'Slow'}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <TimelineIcon sx={{ color: timeColorScheme.primary, fontSize: 32, mb: 1 }} />
                          <Typography variant="body2" color="text.secondary">
                            Total Time
                          </Typography>
                          <Typography variant="h6" sx={{ color: timeColorScheme.primary, fontWeight: 'bold' }}>
                            {Math.round((new Date(completedAt) - new Date(createdAt)) / 60000)} min
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            </Grid>
          </Grid>

          {/* Study Recommendations */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ color: recommendationsColorScheme.primary }}>
              Study Recommendations
            </Typography>
            <Grid container spacing={2}>
              {incorrectAnswers > 0 && questions.map((question, index) => {
                if (!isAnswerCorrect(question, answers[question._id])) {
                  return (
                    <Grid item xs={12} sm={6} md={4} key={question._id}>
                      <Paper sx={{ 
                        p: 2, 
                        borderRadius: 2,
                        background: theme.palette.mode === 'dark'
                          ? `linear-gradient(135deg, ${recommendationsColorScheme.light} 0%, ${theme.palette.background.paper} 100%)`
                          : `linear-gradient(135deg, ${recommendationsColorScheme.light} 0%, #ffffff 100%)`,
                        border: `1px solid ${recommendationsColorScheme.light}`
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <MenuBookIcon sx={{ color: recommendationsColorScheme.primary }} />
                          <Typography variant="subtitle1" sx={{ color: recommendationsColorScheme.primary, fontWeight: 'bold' }}>
                            Topic {index + 1}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Review: {question.topic || 'General Knowledge'}
                        </Typography>
                      </Paper>
                    </Grid>
                  );
                }
                return null;
              })}
            </Grid>
          </Box>
        </Paper>

        {/* Share Results */}
        <SpeedDial
          ariaLabel="Share Results"
          sx={{ 
            position: 'fixed', 
            bottom: 16, 
            right: 16,
            '& .MuiFab-primary': {
              bgcolor: badgeColorScheme.primary,
              '&:hover': {
                bgcolor: badgeColorScheme.primary
              }
            }
          }}
          icon={<SpeedDialIcon />}
        >
          <SpeedDialAction
            icon={<FacebookIcon />}
            tooltipTitle="Share on Facebook"
            onClick={() => shareResult('facebook')}
          />
          <SpeedDialAction
            icon={<TwitterIcon />}
            tooltipTitle="Share on Twitter"
            onClick={() => shareResult('twitter')}
          />
          <SpeedDialAction
            icon={<WhatsAppIcon />}
            tooltipTitle="Share on WhatsApp"
            onClick={() => shareResult('whatsapp')}
          />
          <SpeedDialAction
            icon={<LinkedInIcon />}
            tooltipTitle="Share on LinkedIn"
            onClick={() => shareResult('linkedin')}
          />
        </SpeedDial>
        
        {/* Questions Review Section */}
        <Paper 
          elevation={3} 
          sx={{ 
            p: { xs: 2, md: 4 }, 
            mb: 4, 
            borderRadius: 3,
            background: theme.palette.mode === 'dark'
              ? `linear-gradient(135deg, ${summaryColorScheme.light} 0%, ${theme.palette.background.paper} 100%)`
              : `linear-gradient(135deg, ${summaryColorScheme.light} 0%, #ffffff 100%)`,
            boxShadow: `0 10px 40px ${summaryColorScheme.medium}`,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', color: summaryColorScheme.primary }}>
            Test Summary
          </Typography>
          <Divider sx={{ mb: 3, borderColor: summaryColorScheme.light }} />
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <Box sx={{ 
                  textAlign: 'center', 
                  p: 3,
                  borderRadius: 3,
                  backgroundColor: summaryColorScheme.light,
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: `0 8px 25px ${summaryColorScheme.medium}`
                  }
                }}>
                  <Avatar 
                    sx={{ 
                      mx: 'auto',
                      mb: 2,
                      background: summaryColorScheme.gradient,
                      boxShadow: `0 4px 15px ${summaryColorScheme.medium}`
                    }}
                  >
                    <StarIcon sx={{ 
                      color: theme.palette.mode === 'dark' ? '#FFD700' : '#FFA500',
                      filter: theme.palette.mode === 'dark' 
                        ? 'drop-shadow(0 0 5px rgba(255, 215, 0, 0.7))'
                        : 'drop-shadow(0 0 3px rgba(255, 165, 0, 0.5))',
                      fontSize: '2rem'
                    }} />
                  </Avatar>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Questions
                  </Typography>
                  <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', color: summaryColorScheme.primary }}>
                    <CountUp end={totalQuestions} duration={1.5} />
                  </Typography>
                </Box>
              </motion.div>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <Box sx={{ 
                  textAlign: 'center', 
                  p: 3,
                  borderRadius: 3,
                  backgroundColor: summaryColorScheme.light,
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: `0 8px 25px ${summaryColorScheme.medium}`
                  }
                }}>
                  <Avatar 
                    sx={{ 
                      mx: 'auto',
                      mb: 2,
                      background: summaryColorScheme.gradient,
                      boxShadow: `0 4px 15px ${summaryColorScheme.medium}`
                    }}
                  >
                    <CheckCircleIcon />
                  </Avatar>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Correct Answers
                  </Typography>
                  <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', color: summaryColorScheme.primary }}>
                    <CountUp end={correctAnswers} duration={1.5} />
                  </Typography>
                </Box>
              </motion.div>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <Box sx={{ 
                  textAlign: 'center', 
                  p: 3,
                  borderRadius: 3,
                  backgroundColor: summaryColorScheme.light,
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: `0 8px 25px ${summaryColorScheme.medium}`
                  }
                }}>
                  <Avatar 
                    sx={{ 
                      mx: 'auto',
                      mb: 2,
                      background: summaryColorScheme.gradient,
                      boxShadow: `0 4px 15px ${summaryColorScheme.medium}`
                    }}
                  >
                    <CancelIcon />
                  </Avatar>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Incorrect Answers
                  </Typography>
                  <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', color: summaryColorScheme.primary }}>
                    <CountUp end={incorrectAnswers} duration={1.5} />
                  </Typography>
                </Box>
              </motion.div>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <Box sx={{ 
                  textAlign: 'center', 
                  p: 3,
                  borderRadius: 3,
                  backgroundColor: summaryColorScheme.light,
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: `0 8px 25px ${summaryColorScheme.medium}`
                  }
                }}>
                  <Avatar 
                    sx={{ 
                      mx: 'auto',
                      mb: 2,
                      background: summaryColorScheme.gradient,
                      boxShadow: `0 4px 15px ${summaryColorScheme.medium}`
                    }}
                  >
                    <EmojiEventsIcon />
                  </Avatar>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Result
                  </Typography>
                  <Chip 
                    label={percentage >= 60 ? "PASSED" : "FAILED"}
                    color={percentage >= 60 ? "success" : "error"}
                    sx={{ 
                      fontWeight: 'bold', 
                      px: 2,
                      py: 1,
                      fontSize: '1rem',
                      background: summaryColorScheme.gradient,
                      color: 'white',
                      boxShadow: `0 4px 15px ${summaryColorScheme.medium}`
                    }}
                  />
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </Paper>
        
        <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 3, fontWeight: 'bold', color: summaryColorScheme.primary }}>
          Question Review
        </Typography>
        
        {questions.map((question, index) => {
          const userAnswer = answers[question._id] || null;
          const isCorrect = isAnswerCorrect(question, userAnswer);
          
          return (
            <motion.div
              key={question._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Paper 
                elevation={2} 
                sx={{ 
                  p: 3, 
                  mb: 3, 
                  borderRadius: 3,
                  borderLeft: 6,
                  borderLeftColor: isCorrect ? summaryColorScheme.primary : '#d63031',
                  background: theme.palette.mode === 'dark'
                    ? `linear-gradient(135deg, ${summaryColorScheme.light} 0%, ${theme.palette.background.paper} 100%)`
                    : `linear-gradient(135deg, ${summaryColorScheme.light} 0%, #ffffff 100%)`,
                  boxShadow: `0 8px 25px ${summaryColorScheme.medium}`,
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: `0 12px 35px ${summaryColorScheme.medium}`
                  }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold', color: summaryColorScheme.primary }}>
                    Question {index + 1}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {isCorrect ? (
                      <Chip 
                        icon={<CheckCircleIcon />} 
                        label="Correct" 
                        color="success" 
                        variant="outlined" 
                        sx={{ 
                          fontWeight: 'bold',
                          background: summaryColorScheme.gradient,
                          color: 'white',
                          boxShadow: `0 4px 15px ${summaryColorScheme.medium}`
                        }}
                      />
                    ) : (
                      <Chip 
                        icon={<CancelIcon />} 
                        label="Incorrect" 
                        color="error" 
                        variant="outlined" 
                        sx={{ 
                          fontWeight: 'bold',
                          background: 'linear-gradient(45deg, #d63031, #e17055)',
                          color: 'white',
                          boxShadow: '0 4px 15px rgba(214, 48, 49, 0.2)'
                        }}
                      />
                    )}
                  </Box>
                </Box>
                
                <Typography variant="body1" sx={{ mb: 2, fontWeight: 'medium' }}>
                  {question.question}
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  {question.options && question.options.map(option => {
                    const isOptionSelected = userAnswer === option.text || userAnswer === option._id;
                    const isOptionCorrect = option.text === question.correctAnswer || option._id === question.correctAnswer;
                    
                    let bgColor = theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'grey.100';
                    let borderColor = theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'grey.300';
                    
                    if (isOptionSelected && isOptionCorrect) {
                      bgColor = theme.palette.mode === 'dark' 
                        ? 'rgba(108, 92, 231, 0.2)' 
                        : summaryColorScheme.light;
                      borderColor = theme.palette.mode === 'dark' 
                        ? 'rgba(162, 155, 254, 0.5)' 
                        : summaryColorScheme.primary;
                    } else if (isOptionSelected && !isOptionCorrect) {
                      bgColor = theme.palette.mode === 'dark' 
                        ? 'rgba(214, 48, 49, 0.2)' 
                        : 'rgba(214, 48, 49, 0.1)';
                      borderColor = theme.palette.mode === 'dark' 
                        ? 'rgba(214, 48, 49, 0.5)' 
                        : '#d63031';
                    } else if (!isOptionSelected && isOptionCorrect) {
                      bgColor = theme.palette.mode === 'dark' 
                        ? 'rgba(108, 92, 231, 0.2)' 
                        : summaryColorScheme.light;
                      borderColor = theme.palette.mode === 'dark' 
                        ? 'rgba(162, 155, 254, 0.5)' 
                        : summaryColorScheme.primary;
                    }
                    
                    return (
                      <Box 
                        key={option._id} 
                        sx={{ 
                          p: 2, 
                          mb: 1, 
                          borderRadius: 2,
                          backgroundColor: bgColor,
                          border: '1px solid',
                          borderColor: borderColor,
                          transition: 'all 0.3s',
                          '&:hover': {
                            transform: 'translateX(5px)',
                            boxShadow: theme.palette.mode === 'dark' 
                              ? '0 4px 15px rgba(0, 0, 0, 0.3)'
                              : '0 4px 15px rgba(0, 0, 0, 0.1)'
                          }
                        }}
                      >
                        <Typography variant="body2">
                          {option.text}
                          {isOptionCorrect && !isOptionSelected && (
                            <Typography component="span" sx={{ ml: 1, color: summaryColorScheme.primary, fontWeight: 'bold' }}>
                              (Correct Answer)
                            </Typography>
                          )}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
                
                {!isCorrect && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Explanation:</strong> {question.explanation || "No explanation provided."}
                    </Typography>
                  </Box>
                )}
              </Paper>
            </motion.div>
          );
        })}
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              variant="contained" 
              color="primary" 
              href="/dashboard"
              size={isMobile ? "medium" : "large"}
              sx={{ 
                px: { xs: 3, md: 4 },
                py: 1.5,
                borderRadius: 3,
                fontWeight: 'bold',
                boxShadow: `0 8px 25px ${badgeColorScheme.medium}`,
                background: badgeColorScheme.gradient,
                '&:hover': {
                  background: badgeColorScheme.gradient,
                  boxShadow: `0 12px 35px ${badgeColorScheme.medium}`
                }
              }}
            >
              Back to Dashboard
            </Button>
          </motion.div>
        </Box>
      </motion.div>
    </Container>
  );
};

export default TestResultsPage; 