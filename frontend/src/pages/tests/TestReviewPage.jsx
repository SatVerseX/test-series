import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Container, Typography, Box, CircularProgress, Paper, Divider, Grid, 
  Button, Card, CardContent, CardHeader, Avatar, Chip, 
  Accordion, AccordionSummary, AccordionDetails, IconButton,
  Tooltip, useTheme, useMediaQuery
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TimerIcon from '@mui/icons-material/Timer';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import { motion } from 'framer-motion';

const COLORS = {
  correct: {
    light: 'rgba(46, 125, 50, 0.1)',
    main: 'rgba(46, 125, 50, 0.9)',
    border: 'rgba(46, 125, 50, 0.3)',
    text: '#1b5e20'
  },
  incorrect: {
    light: 'rgba(211, 47, 47, 0.1)',
    main: 'rgba(211, 47, 47, 0.9)',
    border: 'rgba(211, 47, 47, 0.3)',
    text: '#b71c1c'
  },
  unattempted: {
    light: 'rgba(245, 124, 0, 0.1)',
    main: 'rgba(245, 124, 0, 0.9)',
    border: 'rgba(245, 124, 0, 0.3)',
    text: '#e65100'
  }
};

const TestReviewPage = () => {
  const { testId, userId, attemptId } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [testData, setTestData] = useState(null);
  const [testAttempt, setTestAttempt] = useState(null);
  const [error, setError] = useState(null);
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Format time function
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0m 0s';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  useEffect(() => {
    const fetchTestReview = async () => {
      setLoading(true);
      try {
        // Fetch the test data
        const testResponse = await api.get(`/api/tests/${testId}`);
        if (!testResponse.data) {
          throw new Error('Test not found');
        }
        
        // Log the test data structure
        console.log('Test Data:', testResponse.data);
        setTestData(testResponse.data);

        // Get the effective user ID - prefer URL param, fallback to Firebase ID
        const effectiveUserId = userId || user?.firebaseId;
        console.log('Current user:', user);
        console.log('Using effectiveUserId:', effectiveUserId);
        console.log('Attempt ID (if available):', attemptId);

        if (!effectiveUserId && !attemptId) {
          throw new Error('No valid user ID or attempt ID available');
        }

        // Try different approaches to fetch the attempt data
        let attemptData = null;
        let error = null;

        // 1. First try using the attempt ID directly if available
        if (attemptId && attemptId !== 'undefined') {
          try {
            console.log(`Trying to fetch attempt by ID: ${attemptId}`);
            const attemptByIdResponse = await api.get(`/api/tests/${testId}/attempts-by-id/${attemptId}`);
            if (attemptByIdResponse.data) {
              console.log('Successfully fetched attempt by ID');
              attemptData = attemptByIdResponse.data;
            }
          } catch (err) {
            console.log('Error fetching by attempt ID:', err);
            error = err;
          }
        }

        // 2. If not found, try using user-attempt endpoint (most recent attempt)
        if (!attemptData && effectiveUserId) {
          try {
            console.log(`Trying to fetch most recent attempt for user: ${effectiveUserId}`);
            const userAttemptResponse = await api.get(`/api/tests/${testId}/user-attempt`);
            if (userAttemptResponse.data) {
              console.log('Successfully fetched most recent user attempt');
              attemptData = userAttemptResponse.data;
            }
          } catch (err) {
            console.log('Error fetching most recent user attempt:', err);
            if (!error) error = err;
          }
        }

        // 3. If still not found, try the user-attempts endpoint with effectiveUserId
        if (!attemptData && effectiveUserId) {
          try {
            console.log(`Trying to fetch attempts for user ID: ${effectiveUserId}`);
            const userAttemptsResponse = await api.get(`/api/tests/${testId}/user-attempts/${effectiveUserId}`);
            if (userAttemptsResponse.data) {
              console.log('Successfully fetched user attempt by ID');
              attemptData = userAttemptsResponse.data;
            }
          } catch (err) {
            console.log('Error fetching by user ID:', err);
            if (!error) error = err;
          }
        }

        // If we still don't have data, throw the last error
        if (!attemptData) {
          throw error || new Error('No test attempt found');
        }
        
        // Log the attempt data structure
        console.log('Test Attempt Data:', attemptData);
        
        // Normalize the data structure - ensure answers is an array
        const normalizedAttempt = {
          ...attemptData,
          // Check for different time properties
          timeSpent: attemptData.timeSpent || 
                     attemptData.duration || 
                     attemptData.timeTaken || 
                     attemptData.time || 0,
          answers: Array.isArray(attemptData.answers) 
            ? attemptData.answers 
            : (typeof attemptData.answers === 'object' && attemptData.answers !== null)
              ? Object.entries(attemptData.answers).map(([questionId, answer]) => ({
                  questionId,
                  selectedAnswer: answer
                }))
              : []
        };
        
        console.log('Normalized attempt with time:', normalizedAttempt);
        setTestAttempt(normalizedAttempt);

        // Load bookmarked questions from local storage
        const savedBookmarks = localStorage.getItem(`bookmarked-questions-${testId}`);
        if (savedBookmarks) {
          setBookmarkedQuestions(JSON.parse(savedBookmarks));
        }

      } catch (err) {
        console.error('Error fetching test review:', err);
        setError(err.response?.data?.message || 'Failed to load test review. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (testId) {
      fetchTestReview();
    }
  }, [testId, userId, user?.firebaseId, attemptId]);

  const handleExpandQuestion = (questionId) => {
    setExpandedQuestion(expandedQuestion === questionId ? null : questionId);
  };

  const toggleBookmark = (questionId) => {
    const updatedBookmarks = bookmarkedQuestions.includes(questionId)
      ? bookmarkedQuestions.filter(id => id !== questionId)
      : [...bookmarkedQuestions, questionId];
    
    setBookmarkedQuestions(updatedBookmarks);
    localStorage.setItem(`bookmarked-questions-${testId}`, JSON.stringify(updatedBookmarks));
  };

  const isAnswerCorrect = (question, userAnswer) => {
    if (!question || !userAnswer) return false;
    
    // For MCQ or True/False questions
    if (question.type === 'mcq' || question.type === 'multiple-choice' || question.type === 'trueFalse') {
      // First try to match option IDs
      if (question.options && question.options.length > 0) {
        const correctOption = question.options.find(opt => 
          (typeof opt === 'object' && opt.text === question.correctAnswer) ||
          (typeof opt === 'string' && opt === question.correctAnswer)
        );
        
        if (correctOption) {
          const correctOptionId = typeof correctOption === 'object' ? 
            correctOption._id.toString() : correctOption;
          
          // Compare with option ID or text
          return userAnswer === correctOptionId || 
                 userAnswer === question.correctAnswer || 
                 (correctOption.text && userAnswer === correctOption.text);
        }
      }
      
      // Fall back to direct text comparison
      const normalizedUserAnswer = typeof userAnswer === 'string' ? 
        userAnswer.toLowerCase().trim() : userAnswer;
      const normalizedCorrectAnswer = typeof question.correctAnswer === 'string' ? 
        question.correctAnswer.toLowerCase().trim() : question.correctAnswer;
      return normalizedUserAnswer === normalizedCorrectAnswer;
    } 
    // For multiple answer questions
    else if (question.type === 'multiple-answer') {
      const correctAnswers = Array.isArray(question.correctAnswers) ? question.correctAnswers : [question.correctAnswer];
      const userAnswers = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
      
      // Normalize all answers for comparison
      const normalizedCorrectAnswers = correctAnswers.map(ans => 
        typeof ans === 'string' ? ans.toLowerCase().trim() : ans
      );
      const normalizedUserAnswers = userAnswers.map(ans => 
        typeof ans === 'string' ? ans.toLowerCase().trim() : ans
      );
      
      return normalizedCorrectAnswers.length === normalizedUserAnswers.length &&
             normalizedCorrectAnswers.every(ans => normalizedUserAnswers.includes(ans));
    }
    // For short answer questions
    else if (question.type === 'shortAnswer') {
      const normalizedUserAnswer = typeof userAnswer === 'string' ? 
        userAnswer.toLowerCase().trim() : userAnswer;
      const normalizedCorrectAnswer = typeof question.correctAnswer === 'string' ? 
        question.correctAnswer.toLowerCase().trim() : question.correctAnswer;
      return normalizedUserAnswer === normalizedCorrectAnswer;
    }
    // For integer questions
    else if (question.type === 'integer') {
      return parseInt(userAnswer) === parseInt(question.correctAnswer);
    }
    
    return false;
  };

  const getQuestionStatus = (question) => {
    if (!testAttempt || !Array.isArray(testAttempt.answers)) return 'unattempted';
    
    const userAnswer = testAttempt.answers.find(a => a.questionId === question._id);
    if (!userAnswer) return 'unattempted';
    
    return isAnswerCorrect(question, userAnswer.selectedAnswer) ? 'correct' : 'incorrect';
  };

  // Filter questions based on active filter
  const getFilteredQuestions = () => {
    if (!testData?.questions) return [];
    
    switch (activeFilter) {
      case 'correct':
        return testData.questions.filter(q => getQuestionStatus(q) === 'correct');
      case 'incorrect':
        return testData.questions.filter(q => getQuestionStatus(q) === 'incorrect');
      case 'bookmarked':
        return testData.questions.filter(q => bookmarkedQuestions.includes(q._id));
      default:
        return testData.questions;
    }
  };

  // Handle filter change
  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setExpandedQuestion(null); // Close any expanded question when filter changes
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Paper sx={{ p: 3, mt: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            {error}
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/dashboard')}
            startIcon={<ArrowBackIcon />}
          >
            Back to Dashboard
          </Button>
        </Paper>
      </Container>
    );
  }

  if (!testData || !testAttempt) {
    return (
      <Container>
        <Paper sx={{ p: 3, mt: 4, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            Test or attempt data not found
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/dashboard')}
            startIcon={<ArrowBackIcon />}
          >
            Back to Dashboard
          </Button>
        </Paper>
      </Container>
    );
  }

  // Calculate statistics
  const totalQuestions = testData?.questions?.length || 0;
  const totalMarks = testData?.questions?.reduce((sum, q) => sum + q.marks, 0) || 0;
  const attemptedQuestions = Array.isArray(testAttempt?.answers) ? testAttempt.answers.length : 0;
  const unattemptedQuestions = totalQuestions - attemptedQuestions;
  
  const correctAnswers = Array.isArray(testAttempt?.answers) 
    ? testAttempt.answers.filter(answer => {
        const question = testData?.questions?.find(q => q._id === answer.questionId);
        return question && isAnswerCorrect(question, answer.selectedAnswer);
      }).length 
    : 0;
  
  // Incorrect answers are only counted for attempted questions
  const incorrectAnswers = attemptedQuestions - correctAnswers;
  
  // Calculate obtained marks
  const obtainedMarks = testAttempt?.score || 0;
  const percentageScore = totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 100) : 0;

  return (
    <Container maxWidth="lg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper 
          elevation={0}
          sx={{ 
            p: { xs: 2, sm: 3, md: 4 }, 
            mt: 2, 
            mb: 4, 
            borderRadius: '20px',
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(145deg, rgba(40,40,40,1) 0%, rgba(30,30,30,1) 100%)'
              : 'linear-gradient(145deg, rgba(255,255,255,1) 0%, rgba(250,250,250,1) 100%)',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 8px 32px rgba(0,0,0,0.3)'
              : '0 8px 32px rgba(0,0,0,0.08)',
            border: `1px solid ${theme.palette.divider}`
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <IconButton 
              onClick={() => {
                const effectiveUserId = userId || user?.firebaseId;
                navigate(`/test-results/${testId}/${effectiveUserId}`);
              }}
              sx={{ mr: 2 }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
              Test Review
            </Typography>
          </Box>
          
          <Typography variant="h5" gutterBottom sx={{ color: theme.palette.primary.main }}>
            {testData.title}
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          {/* Test Summary Card */}
          <Card 
            elevation={0}
            sx={{ 
              mb: 4, 
              borderRadius: '16px',
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(145deg, rgba(45,45,45,1) 0%, rgba(35,35,35,1) 100%)'
                : 'linear-gradient(145deg, rgba(250,250,250,1) 0%, rgba(245,245,245,1) 100%)',
              border: `1px solid ${theme.palette.divider}`,
              backdropFilter: 'blur(20px)',
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)'
              }
            }}
          >
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 1 }}>
                      <Typography variant="body1">{obtainedMarks}/{totalMarks}</Typography>
                    </Avatar>
                    <Typography variant="subtitle1">Your Score ({percentageScore}%)</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'success.main', mr: 1 }}>
                      <CheckCircleIcon />
                    </Avatar>
                    <Typography variant="subtitle1">Correct: {correctAnswers}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'error.main', mr: 1 }}>
                      <CancelIcon />
                    </Avatar>
                    <Typography variant="subtitle1">Incorrect: {incorrectAnswers}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'warning.main', mr: 1 }}>
                      <TimerIcon />
                    </Avatar>
                    <Typography variant="subtitle1">
                      Time: {formatTime(testAttempt?.timeSpent || testAttempt?.duration || 0)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          
          {/* Filter Options */}
          <Box sx={{ 
            mb: 3, 
            display: 'flex', 
            gap: 1.5, 
            flexWrap: 'wrap',
            '& .MuiChip-root': {
              borderRadius: '12px',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }
            }
          }}>
            <Chip 
              label="All Questions" 
              color={activeFilter === 'all' ? 'primary' : 'default'}
              onClick={() => handleFilterChange('all')}
              variant={activeFilter === 'all' ? 'filled' : 'outlined'}
            />
            <Chip 
              label={`Correct (${correctAnswers})`}
              color={activeFilter === 'correct' ? 'success' : 'default'}
              onClick={() => handleFilterChange('correct')}
              variant={activeFilter === 'correct' ? 'filled' : 'outlined'}
              icon={<CheckCircleIcon />}
            />
            <Chip 
              label={`Incorrect (${incorrectAnswers})`}
              color={activeFilter === 'incorrect' ? 'error' : 'default'}
              onClick={() => handleFilterChange('incorrect')}
              variant={activeFilter === 'incorrect' ? 'filled' : 'outlined'}
              icon={<CancelIcon />}
            />
            <Chip 
              label={`Bookmarked (${bookmarkedQuestions.length})`}
              color={activeFilter === 'bookmarked' ? 'secondary' : 'default'}
              onClick={() => handleFilterChange('bookmarked')}
              variant={activeFilter === 'bookmarked' ? 'filled' : 'outlined'}
              icon={<BookmarkIcon />}
            />
          </Box>
          
          {/* Questions Accordions */}
          {getFilteredQuestions().map((question, index) => {
            const questionStatus = getQuestionStatus(question);
            const statusColors = questionStatus === 'correct' 
              ? COLORS.correct 
              : questionStatus === 'incorrect' 
                ? COLORS.incorrect 
                : COLORS.unattempted;
            const userAnswer = Array.isArray(testAttempt?.answers) 
              ? testAttempt.answers.find(a => a.questionId === question._id)?.selectedAnswer
              : null;
            const isBookmarked = bookmarkedQuestions.includes(question._id);
            
            return (
              <Accordion 
                key={question._id || index}
                expanded={expandedQuestion === question._id}
                onChange={() => handleExpandQuestion(question._id)}
                TransitionProps={{ unmountOnExit: true }}
                sx={{ 
                  mb: 2, 
                  borderRadius: '12px !important',
                  overflow: 'hidden',
                  border: `1px solid ${statusColors.border}`,
                  boxShadow: 'none',
                  transition: 'all 0.2s ease-in-out',
                  '&:before': { display: 'none' },
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 20px ${statusColors.border}`
                  },
                  '&.Mui-expanded': {
                    boxShadow: `0 8px 24px ${statusColors.border}`
                  }
                }}
              >
                <AccordionSummary
                  expandIcon={
                    <ExpandMoreIcon sx={{ 
                      color: statusColors.text,
                      transition: 'transform 0.2s ease-in-out',
                      '.Mui-expanded &': {
                        transform: 'rotate(180deg)'
                      }
                    }} />
                  }
                  sx={{ 
                    bgcolor: statusColors.light,
                    '&:hover': {
                      bgcolor: theme.palette.mode === 'dark'
                        ? `rgba(255, 255, 255, 0.05)`
                        : `rgba(0, 0, 0, 0.02)`
                    }
                  }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    width: '100%', 
                    justifyContent: 'space-between',
                    gap: 2
                  }}>
                    <Typography 
                      sx={{ 
                        flex: 1,
                        fontWeight: 500,
                        color: statusColors.text
                      }}
                    >
                      Q{index + 1}: {question.text || question.question || 'Question not available'}
                    </Typography>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      minWidth: 'fit-content'
                    }}>
                      {questionStatus === 'correct' && (
                        <Tooltip title="Correct Answer">
                          <CheckCircleIcon sx={{ color: statusColors.main }} />
                        </Tooltip>
                      )}
                      {questionStatus === 'incorrect' && (
                        <Tooltip title="Incorrect Answer">
                          <CancelIcon sx={{ color: statusColors.main }} />
                        </Tooltip>
                      )}
                      <Tooltip title={isBookmarked ? "Remove bookmark" : "Bookmark this question"}>
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBookmark(question._id);
                          }}
                          sx={{
                            color: theme.palette.secondary.main,
                            '&:hover': {
                              bgcolor: theme.palette.mode === 'dark'
                                ? 'rgba(255, 255, 255, 0.1)'
                                : 'rgba(0, 0, 0, 0.05)',
                              transform: 'scale(1.1)'
                            }
                          }}
                        >
                          {isBookmarked ? (
                            <BookmarkIcon color="secondary" />
                          ) : (
                            <BookmarkBorderIcon />
                          )}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ 
                  px: 3, 
                  py: 2,
                  bgcolor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.02)'
                    : 'rgba(255, 255, 255, 0.7)',
                }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                      Question:
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {typeof question.question === 'object' ? 
                        (question.question.text || JSON.stringify(question.question)) : 
                        String(question.question)}
                    </Typography>
                    
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                      Options:
                    </Typography>
                    <Box sx={{ ml: 2, mb: 2 }}>
                      {question.options?.map((option, i) => {
                        const optionText = typeof option === 'object' && option !== null 
                          ? (option.text || JSON.stringify(option))
                          : String(option);
                        
                        const correctAnswerText = typeof question.correctAnswer === 'object' && question.correctAnswer !== null
                          ? question.correctAnswer.text || JSON.stringify(question.correctAnswer)
                          : String(question.correctAnswer);
                        
                        const userAnswerText = typeof userAnswer === 'object' && userAnswer !== null
                          ? userAnswer.text || JSON.stringify(userAnswer)
                          : String(userAnswer);
                        
                        const isCorrect = correctAnswerText === optionText;
                        const isSelected = userAnswerText === optionText;
                        
                        return (
                          <Typography 
                            key={i} 
                            variant="body1" 
                            sx={{ 
                              mb: 1,
                              p: 1,
                              borderRadius: 1,
                              bgcolor: isCorrect 
                                ? 'success.light'
                                : isSelected && !isCorrect
                                  ? 'error.light'
                                  : 'transparent',
                              color: isCorrect
                                ? 'success.dark'
                                : isSelected && !isCorrect
                                  ? 'error.dark'
                                  : 'text.primary',
                              fontWeight: (isCorrect || isSelected) ? 600 : 400
                            }}
                          >
                            {String.fromCharCode(65 + i)}. {optionText}
                            {isCorrect && ' ✓'}
                            {isSelected && !isCorrect && ' ✗'}
                          </Typography>
                        );
                      })}
                    </Box>
                    
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                      Your Answer:
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        mb: 2, 
                        color: questionStatus === 'correct' ? 'success.main' : 'error.main',
                        fontWeight: 500
                      }}
                    >
                      {userAnswer ? (
                        Array.isArray(userAnswer) 
                          ? userAnswer.join(', ')
                          : typeof userAnswer === 'object' && userAnswer !== null
                            ? userAnswer.text || JSON.stringify(userAnswer)
                            : String(userAnswer)
                      ) : (
                        'Not attempted'
                      )}
                    </Typography>
                    
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                      Correct Answer:
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2, color: 'success.main', fontWeight: 500 }}>
                      {question.type === 'multiple-choice' 
                        ? (typeof question.correctAnswer === 'object' && question.correctAnswer !== null
                            ? question.correctAnswer.text || JSON.stringify(question.correctAnswer)
                            : String(question.correctAnswer))
                        : Array.isArray(question.correctAnswers)
                            ? question.correctAnswers.map(ans => 
                                typeof ans === 'object' && ans !== null 
                                  ? ans.text || JSON.stringify(ans) 
                                  : String(ans)
                              ).join(', ')
                            : 'Not specified'
                      }
                    </Typography>
                    
                    {question.explanation && (
                      <>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                          Explanation:
                        </Typography>
                        <Paper
                          elevation={0}
                          sx={{ 
                            p: 2, 
                            mb: 2, 
                            bgcolor: 'background.default',
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: '8px'
                          }}
                        >
                          <Typography variant="body1">
                            {question.explanation}
                          </Typography>
                        </Paper>
                      </>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
            );
          })}
          
          {/* Navigation Buttons */}
          <Box sx={{ 
            mt: 4, 
            display: 'flex', 
            justifyContent: 'space-between',
            gap: 2,
            '& .MuiButton-root': {
              borderRadius: '12px',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }
            }
          }}>
            <Button 
              variant="outlined" 
              onClick={() => {
                const effectiveUserId = userId || user?.firebaseId;
                navigate(`/test-results/${testId}/${effectiveUserId}`);
              }}
              startIcon={<ArrowBackIcon />}
            >
              Back to Results
            </Button>
            <Button 
              variant="contained" 
              onClick={() => navigate('/dashboard')}
            >
              Go to Dashboard
            </Button>
          </Box>
        </Paper>
      </motion.div>
    </Container>
  );
};

export default TestReviewPage; 