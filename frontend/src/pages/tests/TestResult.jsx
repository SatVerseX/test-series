import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  Chip,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  Radio,
  RadioGroup,
  FormControlLabel,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon,
  CalendarToday as CalendarTodayIcon,
  Timer as TimerIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { PieChart } from 'react-minimal-pie-chart';
import CountUp from 'react-countup';
import { clearTestCache, addCacheBusting } from '../../utils/clearCache';

// Function to format duration in milliseconds to a readable format
const formatDuration = (durationMs) => {
  if (!durationMs) return '0m';
  
  const seconds = Math.floor((durationMs / 1000) % 60);
  const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
};

const TestResult = () => {
  const { testId, attemptId } = useParams();
  const { user, api } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [test, setTest] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState({});
  const resultRef = useRef(null);

  useEffect(() => {
    const fetchTestResult = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        
        // Clear any cached data for this test
        clearTestCache(testId);
        
        // Fetch test attempt data with cache-busting headers
        const attemptResponse = await api.get(
          `/api/tests/${testId}/attempts/${user.firebaseId}`,
          addCacheBusting()
        );
        
        console.log('Got test attempt data:', attemptResponse.data);
        
        // Get the test details
        const testResponse = await api.get(
          `/api/tests/${testId}`, 
          addCacheBusting()
        );
        
        console.log('Got test details:', testResponse.data);
        
        // Create a corrected version of the attempt with updated score if needed
        let correctedAttempt = {...attemptResponse.data};
        
        // Detect discrepancy between dashboard and test result view
        // If we're showing 0% but the database or dashboard shows it differently
        if ((correctedAttempt.score === 0 || !correctedAttempt.score) && testResponse.data.questions) {
          console.log('⚠️ Score appears incorrect, fixing calculation');
          
          // Try to calculate score manually
          const totalQuestions = testResponse.data.questions.length;
          let correctCount = 0;
          let correctAnswerIds = [];
          
          // Check each question with multiple comparison strategies
          for (const question of testResponse.data.questions) {
            const userAnswer = correctedAttempt.answers?.[question._id];
            if (!userAnswer) continue;
            
            let isCorrect = false;
            
            // First check exact match
            if (String(userAnswer).toLowerCase().trim() === String(question.correctAnswer).toLowerCase().trim()) {
              isCorrect = true;
            } 
            // Then check for MCQ options
            else if (question.type === 'mcq' || question.type === 'trueFalse') {
              // Try to match by option ID or text
              if (question.options && question.options.length > 0) {
                for (const option of question.options) {
                  const optionText = typeof option === 'object' ? option.text : option;
                  const optionId = typeof option === 'object' ? option._id?.toString() : null;
                  
                  // Check if this option matches the correct answer
                  if (optionText === question.correctAnswer || 
                      String(optionText).toLowerCase().trim() === String(question.correctAnswer).toLowerCase().trim()) {
                    
                    // Then check if user answer matches this option
                    if (userAnswer === optionId || 
                        userAnswer === optionText ||
                        String(userAnswer).toLowerCase().trim() === String(optionText).toLowerCase().trim()) {
                      isCorrect = true;
                      break;
                    }
                  }
                }
              }
              
              // Handle true/false special cases
              if (!isCorrect && question.type === 'trueFalse') {
                const normUserAnswer = String(userAnswer).toLowerCase().trim();
                const normCorrectAnswer = String(question.correctAnswer).toLowerCase().trim();
                
                // Check various formats of boolean values
                if ((normUserAnswer === 'true' || normUserAnswer === '1' || normUserAnswer === 't' || normUserAnswer === 'yes') &&
                    (normCorrectAnswer === 'true' || normCorrectAnswer === '1' || normCorrectAnswer === 't' || normCorrectAnswer === 'yes')) {
                  isCorrect = true;
                } else if ((normUserAnswer === 'false' || normUserAnswer === '0' || normUserAnswer === 'f' || normUserAnswer === 'no') &&
                    (normCorrectAnswer === 'false' || normCorrectAnswer === '0' || normCorrectAnswer === 'f' || normCorrectAnswer === 'no')) {
                  isCorrect = true;
                }
              }
            }
            
            if (isCorrect) {
              correctCount++;
              correctAnswerIds.push(question._id);
            }
          }
          
          // Force-fix scores if we detect any correct answers
          console.log(`Found ${correctCount} correct answers out of ${totalQuestions}`);
          if (correctCount > 0 || correctedAttempt.score > 0) {
            // Use the higher score (either what we calculated or what the API returned)
            const apiScore = correctedAttempt.score || 0;
            const calculatedScore = Math.round((correctCount / totalQuestions) * 100);
            const finalScore = Math.max(apiScore, calculatedScore);
            
            console.log(`Fixing score: API=${apiScore}%, Calculated=${calculatedScore}%, Using=${finalScore}%`);
            
            correctedAttempt.score = finalScore;
            correctedAttempt.correctAnswers = correctCount;
            correctedAttempt.isPassed = finalScore >= (testResponse.data.passingScore || 60);
            correctedAttempt.correctQuestionIds = correctAnswerIds;
            
            // Update backend with corrected score to prevent this issue in the future
            try {
              await api.put(
                `/api/tests/${testId}/attempts/${user.firebaseId}/update-score`,
                {
                  score: finalScore,
                  correctAnswers: correctCount,
                  passed: correctedAttempt.isPassed
                }
              );
              console.log('Successfully updated backend with corrected score');
            } catch (scoreUpdateError) {
              console.error('Failed to update score in backend:', scoreUpdateError);
            }
          }
        }
        
        setAttempt(correctedAttempt);
        setTest(testResponse.data);
        
      } catch (error) {
        console.error('Error fetching test result:', error);
        setError('Failed to load test result: ' + (error.response?.data?.message || error.message));
        toast.error('Failed to load test result');
      } finally {
        setLoading(false);
      }
    };

    fetchTestResult();
  }, [testId, attemptId, navigate, user, api]);

  useEffect(() => {
    if (resultRef.current && !loading && test) {
      setTimeout(() => {
        resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 500);
    }
  }, [loading, test]);

  // Calculate score statistics
  const calculateStats = () => {
    if (!test || !attempt) return null;
    
    // PRIORITY 1: Use server-provided scores if available (most accurate)
    if (attempt.status === 'completed' && 
        typeof attempt.score === 'number' && 
        typeof attempt.correctAnswers === 'number') {
      console.log('Using server-provided scores:', {
        score: attempt.score,
        correctAnswers: attempt.correctAnswers,
        passed: attempt.isPassed || attempt.passed
      });
      
      const totalQuestions = test.questions.length;
      return {
        totalQuestions,
        totalMarks: test.totalMarks || totalQuestions,
        correctCount: attempt.correctAnswers,
        incorrectCount: totalQuestions - attempt.correctAnswers,
        unattemptedCount: 0,
        obtainedMarks: Math.round((attempt.score / 100) * (test.totalMarks || totalQuestions)),
        percentageScore: attempt.score,
        passed: attempt.isPassed || attempt.passed
      };
    }
    
    // PRIORITY 2: Calculate based on option IDs (for MCQ questions)
    const totalQuestions = test.questions.length;
    const totalMarks = test.totalMarks || test.questions.reduce((sum, q) => sum + q.marks, 0);
    
    const correctQuestions = test.questions.filter(q => {
      const userAnswer = attempt.answers[q._id];
      if (!userAnswer) return false;
      
      if (q.type === 'mcq' || q.type === 'trueFalse') {
        // First try to match option IDs by finding the option with matching text
        if (q.options && q.options.length > 0) {
          const correctOption = q.options.find(opt => 
            (typeof opt === 'object' && opt.text === q.correctAnswer) ||
            (typeof opt === 'string' && opt === q.correctAnswer)
          );
          
          if (correctOption) {
            const correctOptionId = typeof correctOption === 'object' ? 
              correctOption._id.toString() : correctOption;
            
            // Compare directly with the text if it's a string, or the ID if that's what we have
            const isMatch = userAnswer === correctOptionId || 
                          userAnswer === q.correctAnswer || 
                          (correctOption.text && userAnswer === correctOption.text);
            return isMatch;
          }
        }
        
        // Fall back to direct text comparison if option ID approach fails
        // Also check for case-insensitive matching
        const normalizedUserAnswer = typeof userAnswer === 'string' ? userAnswer.toLowerCase().trim() : userAnswer;
        const normalizedCorrectAnswer = typeof q.correctAnswer === 'string' ? q.correctAnswer.toLowerCase().trim() : q.correctAnswer;
        return normalizedUserAnswer === normalizedCorrectAnswer;
      } else if (q.type === 'shortAnswer') {
        return userAnswer.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim();
      } else if (q.type === 'integer') {
        return parseInt(userAnswer) === parseInt(q.correctAnswer);
      }
      return false;
    });
    
    const correctCount = correctQuestions.length;
    const incorrectCount = totalQuestions - correctCount;
    const obtainedMarks = correctQuestions.reduce((sum, q) => sum + q.marks, 0);
    const percentageScore = Math.round((obtainedMarks / totalMarks) * 100);
    const passed = percentageScore >= test.passingScore;
    
    return {
      totalQuestions,
      totalMarks,
      correctCount,
      incorrectCount,
      unattemptedCount: 0,
      obtainedMarks,
      percentageScore,
      passed
    };
  };

  const stats = calculateStats();
  
  const isQuestionCorrect = (question) => {
    if (!attempt || !attempt.answers) return false;
    
    // Check if question ID is in the correctQuestionIds array (most reliable)
    if (attempt.correctQuestionIds && attempt.correctQuestionIds.length > 0) {
      return attempt.correctQuestionIds.includes(question._id);
    }
    
    const userAnswer = attempt.answers[question._id];
    if (!userAnswer) return false;
    
    // Simple string comparison (case-insensitive)
    if (typeof userAnswer === 'string' && typeof question.correctAnswer === 'string') {
      if (userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()) {
        return true;
      }
    }
    
    // For MCQ, try multiple matching approaches
    if (question.type === 'mcq' || question.type === 'trueFalse') {
      // Try exact match
      if (userAnswer === question.correctAnswer) {
        return true;
      }
      
      // Try option ID/text matching
      if (question.options && question.options.length > 0) {
        // Find the correct option
        for (const option of question.options) {
          // Check if this is the correct option
          const optionText = typeof option === 'object' ? option.text : option;
          const optionId = typeof option === 'object' ? option._id?.toString() : null;
          
          if (optionText === question.correctAnswer || 
              String(optionText).toLowerCase().trim() === String(question.correctAnswer).toLowerCase().trim()) {
            
            // Now check if user answer matches this option
            if (userAnswer === optionId || 
                userAnswer === optionText ||
                String(userAnswer).toLowerCase().trim() === String(optionText).toLowerCase().trim()) {
              return true;
            }
          }
        }
      }
      
      // For true/false, handle special cases
      if (question.type === 'trueFalse') {
        const normalizedUserAnswer = String(userAnswer).toLowerCase().trim();
        const normalizedCorrectAnswer = String(question.correctAnswer).toLowerCase().trim();
        
        // Handle different formats of true/false
        if ((normalizedUserAnswer === 'true' || normalizedUserAnswer === '1' || normalizedUserAnswer === 't' || normalizedUserAnswer === 'yes') &&
            (normalizedCorrectAnswer === 'true' || normalizedCorrectAnswer === '1' || normalizedCorrectAnswer === 't' || normalizedCorrectAnswer === 'yes')) {
          return true;
        }
        
        if ((normalizedUserAnswer === 'false' || normalizedUserAnswer === '0' || normalizedUserAnswer === 'f' || normalizedUserAnswer === 'no') &&
            (normalizedCorrectAnswer === 'false' || normalizedCorrectAnswer === '0' || normalizedCorrectAnswer === 'f' || normalizedCorrectAnswer === 'no')) {
          return true;
        }
      }
    } else if (question.type === 'shortAnswer') {
      return String(userAnswer).toLowerCase().trim() === String(question.correctAnswer).toLowerCase().trim();
    } else if (question.type === 'integer') {
      try {
        const userInt = parseInt(userAnswer);
        const correctInt = parseInt(question.correctAnswer);
        return !isNaN(userInt) && !isNaN(correctInt) && userInt === correctInt;
      } catch (error) {
        return false;
      }
    }
    
    return false;
  };
  
  const getUserAnswer = (question) => {
    if (!attempt || !attempt.answers) return null;
    return attempt.answers[question._id];
  };
  
  const getOptionByText = (question, text) => {
    if (!question.options) return null;
    return question.options.find(opt => opt.text === text);
  };

  const handleAccordionChange = (sectionId) => (_, isExpanded) => {
    setExpanded({ ...expanded, [sectionId]: isExpanded });
  };

  // Get skill proficiency based on section performance
  const getSkillProficiency = (sectionTitle) => {
    const sectionQuestions = test.questions.filter(q => q.sectionTitle === sectionTitle);
    if (!sectionQuestions.length) return { level: 'N/A', color: 'grey' };
    
    const correctCount = sectionQuestions.filter(q => isQuestionCorrect(q)).length;
    const percentage = (correctCount / sectionQuestions.length) * 100;
    
    if (percentage >= 90) return { level: 'Expert', color: '#4caf50' };
    if (percentage >= 75) return { level: 'Proficient', color: '#8bc34a' };
    if (percentage >= 60) return { level: 'Intermediate', color: '#ffeb3b' };
    if (percentage >= 40) return { level: 'Basic', color: '#ff9800' };
    return { level: 'Novice', color: '#f44336' };
  };

  // Clear any cached test results to ensure fresh data
  useEffect(() => {
    // On mount, clear any cached data for this test
    if (window.localStorage) {
      Object.keys(window.localStorage).forEach(key => {
        if (key.includes('testResult') || key.includes('testAttempt')) {
          window.localStorage.removeItem(key);
        }
      });
    }
    
    // Also clear from sessionStorage
    if (window.sessionStorage) {
      Object.keys(window.sessionStorage).forEach(key => {
        if (key.includes('testResult') || key.includes('testAttempt')) {
          window.sessionStorage.removeItem(key);
        }
      });
    }
    
    // Don't force reload - this causes infinite loop
    // window.location.reload(true);
  }, []);

  if (loading) {
    return (
      <Container sx={{ textAlign: 'center', mt: 4 }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading test results...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="h6" color="error">{error}</Typography>
        <Button 
          variant="contained" 
          onClick={() => navigate('/dashboard')} 
          sx={{ mt: 2 }}
          startIcon={<ArrowBackIcon />}
        >
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  if (!test || !attempt) {
    return (
      <Container sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="h6" color="error">Test result not found</Typography>
        <Button 
          variant="contained" 
          onClick={() => navigate('/dashboard')} 
          sx={{ mt: 2 }}
          startIcon={<ArrowBackIcon />}
        >
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ my: 4, position: 'relative' }}>
      {loading ? (
        <Container sx={{ textAlign: 'center', mt: 4 }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Loading test results...</Typography>
        </Container>
      ) : error ? (
        <Container sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="error">{error}</Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/dashboard')} 
            sx={{ mt: 2 }}
            startIcon={<ArrowBackIcon />}
          >
            Back to Dashboard
          </Button>
        </Container>
      ) : !test ? (
        <Container sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="error">Test result not found</Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/dashboard')} 
            sx={{ mt: 2 }}
            startIcon={<ArrowBackIcon />}
          >
            Back to Dashboard
          </Button>
        </Container>
      ) : (
        <>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3, 
              mb: 4, 
              position: 'relative',
              background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
              borderRadius: 2,
              overflow: 'hidden'
            }}
          >
            <Box sx={{ 
              position: 'absolute', 
              top: 0, 
              right: 0, 
              width: '150px', 
              height: '150px',
              background: stats.passed ? 'linear-gradient(45deg, rgba(76, 175, 80, 0.1), rgba(76, 175, 80, 0.3))' : 'linear-gradient(45deg, rgba(244, 67, 54, 0.1), rgba(244, 67, 54, 0.3))',
              clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
              zIndex: 0
            }} />
            
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', position: 'relative', zIndex: 1 }}>
              Test Result: {test.title}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, position: 'relative', zIndex: 1 }}>
              <Chip 
                icon={<CalendarTodayIcon />} 
                label={`Completed: ${new Date(attempt.completedAt).toLocaleString()}`} 
                variant="outlined" 
              />
              <Chip 
                icon={<TimerIcon />} 
                label={`Duration: ${formatDuration(new Date(attempt.completedAt) - new Date(attempt.startTime))}`} 
                variant="outlined" 
              />
              <Chip 
                icon={stats.passed ? <CheckCircleIcon /> : <CancelIcon />} 
                label={stats.passed ? 'PASSED' : 'FAILED'} 
                color={stats.passed ? 'success' : 'error'}
              />
            </Box>
            
            {/* Rest of the top content */}
            {/* ... existing code ... */}
          </Paper>

          <div ref={resultRef}>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={8}>
                <Paper elevation={3} sx={{ p: 3, height: '100%', position: 'relative', overflow: 'hidden', borderRadius: 2 }}>
                  <Typography variant="h5" gutterBottom>Score Summary</Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ 
                        bgcolor: 'background.default', 
                        p: 2, 
                        borderRadius: 2,
                        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                      }}>
                        <Typography variant="h6" gutterBottom>
                          Final Score
                        </Typography>
                        <Typography variant="h2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                          <CountUp 
                            end={stats.percentageScore} 
                            duration={2.5} 
                            suffix="%" 
                            decimals={1}
                            decimal="."
                          />
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ width: 100, height: 100 }}>
                          <PieChart
                            data={[
                              { title: 'Correct', value: stats.correctCount, color: '#4caf50' },
                              { title: 'Incorrect', value: stats.incorrectCount, color: '#f44336' },
                            ]}
                            lineWidth={20}
                            paddingAngle={5}
                            rounded
                            animate
                            animationDuration={1000}
                            label={({ dataEntry }) => `${Math.round(dataEntry.percentage)}%`}
                            labelStyle={{
                              fontSize: '10px',
                              fontFamily: 'sans-serif',
                              fill: '#fff',
                              fontWeight: 'bold',
                            }}
                            labelPosition={70}
                            startAngle={-90}
                          />
                        </Box>
                        <Box>
                          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                            <CountUp 
                              end={stats.obtainedMarks} 
                              duration={2} 
                            />
                            /{stats.totalMarks}
                          </Typography>
                          <Typography variant="h5">
                            <CountUp 
                              end={stats.percentageScore} 
                              duration={2.5} 
                              suffix="%" 
                              decimals={1}
                              decimal="."
                            />
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <List dense>
                        <ListItem sx={{ py: 0 }}>
                          <ListItemText 
                            primary="Total Questions" 
                            secondary={stats.totalQuestions} 
                          />
                        </ListItem>
                        <ListItem sx={{ py: 0 }}>
                          <ListItemText 
                            primary="Correct Answers" 
                            secondary={stats.correctCount}
                            secondaryTypographyProps={{ color: 'success.main' }}
                          />
                        </ListItem>
                        <ListItem sx={{ py: 0 }}>
                          <ListItemText 
                            primary="Incorrect Answers" 
                            secondary={stats.incorrectCount}
                            secondaryTypographyProps={{ color: 'error.main' }}
                          />
                        </ListItem>
                        <ListItem sx={{ py: 0 }}>
                          <ListItemText 
                            primary="Passing Score" 
                            secondary={`${test.passingScore}%`}
                          />
                        </ListItem>
                      </List>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Paper elevation={3} sx={{ 
                  p: 3, 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  borderRadius: 2,
                  background: stats.passed 
                    ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.05) 0%, rgba(76, 175, 80, 0.2) 100%)' 
                    : 'linear-gradient(135deg, rgba(244, 67, 54, 0.05) 0%, rgba(244, 67, 54, 0.2) 100%)'
                }}>
                  <Typography variant="h5" gutterBottom>Performance</Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexGrow: 1,
                    gap: 1
                  }}>
                    <Box sx={{ 
                      width: 150, 
                      height: 150, 
                      borderRadius: '50%', 
                      border: '10px solid',
                      borderColor: stats.passed ? 'success.main' : 'error.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      mb: 2,
                      background: '#fff',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                    }}>
                      <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                        <CountUp 
                          end={stats.percentageScore} 
                          duration={2.5} 
                          suffix="%" 
                          decimals={1}
                          decimal="."
                        />
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {stats.passed ? 'PASSED' : 'FAILED'}
                      </Typography>
                    </Box>
                    
                    <Button 
                      variant="contained" 
                      onClick={() => navigate('/dashboard')}
                      startIcon={<ArrowBackIcon />}
                      fullWidth
                      sx={{ borderRadius: 2 }}
                    >
                      Back to Dashboard
                    </Button>
                    
                    <Button 
                      variant="outlined" 
                      onClick={() => navigate('/tests')}
                      fullWidth
                      sx={{ mt: 1, borderRadius: 2 }}
                    >
                      Take Another Test
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </div>

          {/* Time Analysis Section */}
          <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
            <Typography variant="h5" gutterBottom>Time Analysis</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Box sx={{ 
                  textAlign: 'center', 
                  p: 2, 
                  bgcolor: 'primary.50',
                  borderRadius: 2
                }}>
                  <Typography variant="subtitle1" gutterBottom>Average Time per Question</Typography>
                  <Typography variant="h4" color="primary.main" fontWeight="bold">
                    {attempt.timeTaken && stats.totalQuestions ? 
                      formatDuration(Math.floor((attempt.timeTaken * 1000) / stats.totalQuestions)) : 
                      "N/A"}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={{ 
                  textAlign: 'center', 
                  p: 2, 
                  bgcolor: 'success.50',
                  borderRadius: 2
                }}>
                  <Typography variant="subtitle1" gutterBottom>Completion Speed</Typography>
                  <Typography variant="h4" color="success.main" fontWeight="bold">
                    {(() => {
                      const durationMs = attempt.completedAt && attempt.startTime ? 
                        new Date(attempt.completedAt) - new Date(attempt.startTime) : 0;
                      const testDuration = test.duration || 60; // Default 60 min if not specified
                      const testDurationMs = testDuration * 60 * 1000;
                      
                      if (durationMs && testDurationMs) {
                        const percentageUsed = Math.round((durationMs / testDurationMs) * 100);
                        if (percentageUsed < 30) return "Fast";
                        if (percentageUsed < 70) return "Average";
                        return "Slow";
                      }
                      return "N/A";
                    })()}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={{ 
                  textAlign: 'center', 
                  p: 2, 
                  bgcolor: 'info.50',
                  borderRadius: 2
                }}>
                  <Typography variant="subtitle1" gutterBottom>Total Time</Typography>
                  <Typography variant="h4" color="info.main" fontWeight="bold">
                    {attempt.completedAt && attempt.startTime ? 
                      formatDuration(new Date(attempt.completedAt) - new Date(attempt.startTime)) : 
                      "N/A"}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Study Recommendations Section */}
          <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
            <Typography variant="h5" gutterBottom>Study Recommendations</Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Based on your performance, we recommend focusing on these areas:
            </Typography>
            
            <Grid container spacing={2}>
              {Array.from({ length: Math.min(6, test.sections?.length || 6) }).map((_, idx) => (
                <Grid item xs={12} sm={6} md={4} key={idx}>
                  <Paper 
                    elevation={1} 
                    sx={{ 
                      p: 2, 
                      borderLeft: '4px solid',
                      borderColor: 'warning.main',
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Topic {idx + 1}
                    </Typography>
                    <Typography variant="body2">
                      Review: General Knowledge
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* Skill proficiency section */}
          {test.sections && test.sections.length > 0 && (
            <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
              <Typography variant="h5" gutterBottom>Skill Proficiency</Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Based on your performance in each section of the test:
              </Typography>
              
              <Grid container spacing={2}>
                {test.sections.map((section, idx) => {
                  const proficiency = getSkillProficiency(section.title);
                  const sectionQuestions = test.questions.filter(q => q.sectionTitle === section.title);
                  const correctCount = sectionQuestions.filter(q => isQuestionCorrect(q)).length;
                  const percentage = sectionQuestions.length ? Math.round((correctCount / sectionQuestions.length) * 100) : 0;
                  
                  return (
                    <Grid item xs={12} sm={6} md={4} key={section._id || idx}>
                      <Paper elevation={2} sx={{ 
                        p: 2, 
                        borderRadius: 2,
                        height: '100%',
                        border: '1px solid',
                        borderColor: 'divider',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-5px)',
                          boxShadow: '0 8px 20px rgba(0,0,0,0.1)'
                        }
                      }}>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                          {section.title}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Box sx={{ 
                            height: 10, 
                            flexGrow: 1, 
                            bgcolor: 'grey.200', 
                            borderRadius: 5,
                            mr: 1
                          }}>
                            <Box sx={{ 
                              height: '100%', 
                              borderRadius: 5,
                              width: `${percentage}%`,
                              background: `linear-gradient(90deg, ${proficiency.color} 0%, ${proficiency.color}99 100%)`,
                              transition: 'width 1.5s ease-in-out'
                            }} />
                          </Box>
                          <Typography variant="body2" fontWeight="bold">
                            {percentage}%
                          </Typography>
                        </Box>
                        
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between'
                        }}>
                          <Chip 
                            label={proficiency.level} 
                            size="small"
                            sx={{ 
                              backgroundColor: `${proficiency.color}30`,
                              color: proficiency.color,
                              fontWeight: 'bold'
                            }}
                          />
                          <Typography variant="body2">
                            {correctCount}/{sectionQuestions.length} correct
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            </Paper>
          )}

          {/* Question Review */}
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h5" gutterBottom>Question Review</Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Review your answers below. Correct answers are marked in green, incorrect answers in red.
            </Typography>
            
            {test.sections && test.sections.map((section, sectionIndex) => {
              const sectionQuestions = test.questions.filter(q => q.sectionTitle === section.title);
              const sectionId = section._id || `section-${sectionIndex}`;
              const isExpanded = expanded[sectionId] !== false; // Default to expanded if not set
              
              return (
                <Accordion 
                  key={sectionId} 
                  expanded={isExpanded}
                  onChange={handleAccordionChange(sectionId)}
                  sx={{
                    mb: 2,
                    '&:before': { display: 'none' },
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    borderRadius: '8px !important',
                    overflow: 'hidden'
                  }}
                >
                  <AccordionSummary 
                    expandIcon={<ExpandMoreIcon />}
                    sx={{ 
                      background: isExpanded ? 'rgba(0, 0, 0, 0.03)' : 'transparent',
                      transition: 'background 0.3s ease'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Section {sectionIndex + 1}: {section.title}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircleIcon color="success" fontSize="small" />
                        <Typography variant="body2" fontWeight="medium">
                          {sectionQuestions.filter(q => isQuestionCorrect(q)).length}/{sectionQuestions.length}
                        </Typography>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    {sectionQuestions.map((question, questionIndex) => {
                      const userAnswer = getUserAnswer(question);
                      const isCorrect = isQuestionCorrect(question);
                      
                      return (
                        <Paper 
                          key={question._id} 
                          sx={{ 
                            p: 2, 
                            mb: 2, 
                            border: '1px solid',
                            borderColor: isCorrect ? 'success.light' : 'error.light',
                            borderLeft: '5px solid',
                            borderLeftColor: isCorrect ? 'success.main' : 'error.main',
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              Question {questionIndex + 1}
                            </Typography>
                            <Chip 
                              icon={isCorrect ? <CheckCircleIcon /> : <CancelIcon />}
                              label={isCorrect ? "Correct" : "Incorrect"}
                              color={isCorrect ? "success" : "error"}
                              size="small"
                            />
                          </Box>
                          
                          <Typography variant="body1" paragraph>
                            {question.text}
                          </Typography>
                          
                          {question.type === 'mcq' && (
                            <RadioGroup value={userAnswer || ''}>
                              {question.options.map((option, optIndex) => (
                                <FormControlLabel
                                  key={optIndex}
                                  value={option.text}
                                  control={<Radio />}
                                  label={option.text}
                                  disabled
                                  sx={{
                                    color: option.text === question.correctAnswer 
                                      ? 'success.main' 
                                      : (userAnswer === option.text && userAnswer !== question.correctAnswer)
                                        ? 'error.main'
                                        : 'text.primary',
                                    fontWeight: option.text === question.correctAnswer ? 'bold' : 'normal'
                                  }}
                                />
                              ))}
                            </RadioGroup>
                          )}
                          
                          {question.type === 'trueFalse' && (
                            <RadioGroup value={userAnswer || ''}>
                              {['True', 'False'].map((option) => (
                                <FormControlLabel
                                  key={option}
                                  value={option.toLowerCase()}
                                  control={<Radio />}
                                  label={option}
                                  disabled
                                  sx={{
                                    color: option.toLowerCase() === question.correctAnswer 
                                      ? 'success.main' 
                                      : (userAnswer === option.toLowerCase() && userAnswer !== question.correctAnswer)
                                        ? 'error.main'
                                        : 'text.primary',
                                    fontWeight: option.toLowerCase() === question.correctAnswer ? 'bold' : 'normal'
                                  }}
                                />
                              ))}
                            </RadioGroup>
                          )}
                          
                          {(question.type === 'shortAnswer' || question.type === 'integer') && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2">Your Answer:</Typography>
                              <TextField
                                fullWidth
                                value={userAnswer || ''}
                                disabled
                                sx={{
                                  '& .MuiInputBase-input': {
                                    color: isCorrect ? 'success.main' : 'error.main',
                                    fontWeight: 'bold'
                                  }
                                }}
                              />
                              
                              {!isCorrect && (
                                <Box sx={{ mt: 1 }}>
                                  <Typography variant="subtitle2" color="success.main">
                                    Correct Answer: {question.correctAnswer}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          )}
                          
                          {question.explanation && (
                            <Box sx={{ mt: 2, bgcolor: 'background.default', p: 1, borderRadius: 1 }}>
                              <Typography variant="subtitle2">Explanation:</Typography>
                              <Typography variant="body2">{question.explanation}</Typography>
                            </Box>
                          )}
                        </Paper>
                      );
                    })}
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Paper>
        </>
      )}
    </Container>
  );
};

export default TestResult; 