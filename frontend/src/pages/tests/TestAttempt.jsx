import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTestAttempt } from '../../contexts/TestAttemptContext';
import { useAuth } from '../../contexts/AuthContext';
import TestHeader from '../../components/test/TestHeader';
import SectionSidebar from '../../components/test/SectionSidebar';
import QuestionNavigator from '../../components/test/QuestionNavigator';
import QuestionDisplay from '../../components/test/QuestionDisplay';
import SubmitConfirmation from '../../components/test/SubmitConfirmation';
import TestProgressBar from '../../components/test/TestProgressBar';
import { toast } from 'react-toastify';
import { LoadingButton } from '@mui/lab';
import { 
  Box, 
  Container, 
  Paper, 
  CircularProgress, 
  Typography, 
  Button, 
  IconButton,
  useTheme,
  useMediaQuery,
  Drawer,
  AppBar,
  Toolbar,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControlLabel,
  Radio
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
  Bookmark as BookmarkIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Send as SendIcon
} from '@mui/icons-material';

const TestAttempt = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const {
    test,
    loading,
    error,
    currentSection,
    currentQuestion,
    timeLeft,
    answers,
    questionStatus,
    showSidebar,
    showSubmitModal,
    darkMode,
    setCurrentSection,
    setCurrentQuestion,
    getCurrentQuestion,
    handleAnswerChange,
    markForReview,
    updateQuestionStatus,
    confirmSubmit,
    handleSubmit,
    toggleSidebar,
    toggleDarkMode,
    toggleFullScreen,
    getTestStats,
    formatTime,
    navigateTo,
    nextQuestion,
    prevQuestion,
    setCurrentTestId,
    fetchTest,
    setTimeLeft,
    currentTestId,
    setAnswers,
    isSubmitting,
    setShowSubmitModal,
    setIsSubmitting
  } = useTestAttempt();

  // Initialize test data - Load test ID on mount
  useEffect(() => {
    if (!user) {
      toast.error('Please login to access this test');
      navigate('/login');
      return;
    }

    // Set the current test ID in the context which will trigger data fetching
    console.log('Setting current test ID:', testId);
    if (testId && currentTestId !== testId) {
      setCurrentTestId(testId);
    }
    
    // Set up keyboard shortcuts
    const handleKeyDown = (e) => {
      // Only activate if not typing in an input
      if (e.target.tagName.toLowerCase() === 'input' || 
          e.target.tagName.toLowerCase() === 'textarea') {
        return;
      }
      
      switch (e.key.toLowerCase()) {
        case 'n':
          nextQuestion();
          break;
        case 'p':
          prevQuestion();
          break;
        case 'm':
          if (test && test.questions) {
            const currentSectionQuestions = test.questions.filter(
              q => q.sectionTitle === test.sections[currentSection]?.title
            );
            const currentQuestionId = currentSectionQuestions[currentQuestion]?._id;
            if (currentQuestionId) {
              markForReview(currentQuestionId);
            }
          }
          break;
        case 'f':
          toggleFullScreen();
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [testId, user, navigate, currentTestId, nextQuestion, prevQuestion, markForReview, toggleFullScreen]);
  
  // Add a cleanup function to fix invalid answers state
  useEffect(() => {
    // Only run when we have both test and answers data
    if (test && test.questions && Object.keys(answers).length > 0) {
      // Get valid question IDs
      const validQuestionIds = test.questions.map(q => q._id).filter(Boolean);
      
      // Check if we have excessive answers
      const excessiveAnswers = Object.keys(answers).length > validQuestionIds.length * 3;
      
      if (excessiveAnswers) {
        console.warn(`Detected excessive answers: ${Object.keys(answers).length} answers for ${validQuestionIds.length} questions`);
        
        // Create a clean version of answers with only valid questions
        const cleanAnswers = {};
        validQuestionIds.forEach(qId => {
          if (answers[qId] !== undefined) {
            cleanAnswers[qId] = answers[qId];
          }
        });
        
        // Log the cleanup
        console.log(`Cleaning up answers: keeping ${Object.keys(cleanAnswers).length} valid answers, removing ${Object.keys(answers).length - Object.keys(cleanAnswers).length} invalid answers`);
        
        // Update the answers state with clean version
        setAnswers(cleanAnswers);
        
        // Show notification to the user
        toast.success("Fixed test data inconsistency. Your progress has been restored correctly.", {
          autoClose: 3000
        });
      }
    }
  }, [test, answers, setAnswers]);
  
  // Countdown timer effect
  useEffect(() => {
    if (!timeLeft || loading) return;
    
    const timer = setInterval(() => {
      if (timeLeft <= 1) {
        clearInterval(timer);
        // Auto-submit when time is up
        handleSubmit();
      } else {
        // Update the timeLeft directly instead of using updateTimeLeft
        // since it's managed by the context
        if (typeof setTimeLeft === 'function') {
          setTimeLeft(prev => prev - 1);
        }
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft, loading, handleSubmit, setTimeLeft]);
  
  // Handle time update - this function is now empty as timeLeft is managed by the context
  
  // Force init logic
  const [loadingDuration, setLoadingDuration] = useState(0);
  const [manualOverride, setManualOverride] = useState(false);
  
  // Track loading time
  useEffect(() => {
    let timer;
    if (loading && !manualOverride) {
      timer = setTimeout(() => {
        setLoadingDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [loading, loadingDuration, manualOverride]);
  
  // Function to force bypass loading
  const handleForceBypass = () => {
    setManualOverride(true);
    setLoading(false);
    toast.warning("Loading bypassed. Some features may not work properly.", {
      autoClose: 5000,
    });
  };
  
  // Loading state
  if (loading && !manualOverride) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        bgcolor="background.default"
      >
        <Box textAlign="center" maxWidth="500px">
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading test...
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This may take a moment. The server is being contacted...
            {loadingDuration > 15 && " This is taking longer than expected."}
          </Typography>
          
          <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => window.location.reload()}
            >
              Reload page
            </Button>
            
            {/* Only show bypass option after 20 seconds */}
            {loadingDuration > 20 && (
              <Button
                variant="text"
                color="warning"
                onClick={handleForceBypass}
              >
                Skip loading and proceed (may cause errors)
              </Button>
            )}
          </Box>
          
          {/* Additional help text for persistent issues */}
          {loadingDuration > 30 && (
            <Typography variant="body2" color="error" sx={{ mt: 3 }}>
              You might be experiencing server issues. Try again later or contact support.
            </Typography>
          )}
        </Box>
      </Box>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        bgcolor="background.default"
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            maxWidth: 500,
            width: '100%',
            textAlign: 'center'
          }}
        >
          <Typography variant="h5" color="error" gutterBottom>
            Error Loading Test
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            {error}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            This could be due to a server timeout or connection issue. Please try again.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => window.location.reload()}
              sx={{ flex: 1 }}
            >
              Reload Page
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/tests')}
              sx={{ flex: 1 }}
            >
              Back to Tests
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }
  
  // If test data is not available
  if (!test) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        bgcolor="background.default"
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            maxWidth: 400,
            width: '100%',
            textAlign: 'center'
          }}
        >
          <Typography variant="h5" gutterBottom>
            Test Not Found
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            The test you're looking for could not be found or you do not have access to it.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={() => navigate('/tests')}
          >
            Back to Tests
          </Button>
        </Paper>
      </Box>
    );
  }
  
  // Current question to display
  const currentQuestionData = getCurrentQuestion ? getCurrentQuestion() : null;
  
  // If we have a test but no current question data, try to recover
  if (test && !currentQuestionData && test.questions && test.questions.length > 0) {
    console.warn('No current question found, attempting to recover');
    // Reset to first question of first section
    if (setCurrentSection && setCurrentQuestion) {
      setCurrentSection(0);
      setCurrentQuestion(0);
    }
  }
  
  // Get current question number (1-based index)
  const getCurrentQuestionNumber = () => {
    if (!test?.sections || !test?.questions) return 1;
    
    let questionNumber = 1;
    const currentSectionTitle = test.sections[currentSection]?.title;
    
    // Count questions up to current section
    for (let i = 0; i < currentSection; i++) {
      const sectionTitle = test.sections[i].title;
      questionNumber += test.questions.filter(q => q.sectionTitle === sectionTitle).length;
    }
    
    // Add current question index
    return questionNumber + currentQuestion;
  };

  const handleConfirmation = async () => {
    try {
      if (isSubmitting) return;
      
      // Get final test stats before submission
      const finalStats = getTestStats();
      console.log('Submitting test with stats:', finalStats);
      
      // Call the submit function from context
      const result = await handleSubmit();
      
      if (result && result.attempt) {
        // Clear any cached data
        localStorage.removeItem(`test_${testId}_answers`);
        localStorage.removeItem(`test_${testId}_time`);
        
        // Close the modal
        setShowSubmitModal(false);
        
        // Navigate to results page with correct path format
        navigate(`/test-results/${testId}/${result.attempt.id}`);
      }
    } catch (error) {
      console.error('Error submitting test:', error);
      toast.error(error.message || 'Failed to submit test. Please try again.');
    }
  };

  const question = getCurrentQuestion();
  const questionNumber = getCurrentQuestionNumber();
  const stats = getTestStats();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Header with timer and controls */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <TestHeader 
            title={test?.title || 'Test'} 
            timeLeft={formatTime ? formatTime(timeLeft) : '0:00'} 
            onToggleDarkMode={toggleDarkMode || (() => {})} 
            onToggleFullScreen={toggleFullScreen || (() => {})}
            onToggleSidebar={toggleSidebar || (() => {})}
            darkMode={darkMode || false}
          />
        </Toolbar>
      </AppBar>
      
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Section navigation sidebar */}
        <Drawer
          variant={isMobile ? "temporary" : "persistent"}
          open={showSidebar}
          onClose={toggleSidebar || (() => {})}
          sx={{
            width: 240,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 240,
              boxSizing: 'border-box',
            },
          }}
          ModalProps={{
            keepMounted: true,
            disableEnforceFocus: !isMobile
          }}
        >
          <SectionSidebar 
            sections={test?.sections || []} 
            currentSection={currentSection}
            onSelectSection={(index) => {
              if (setCurrentSection) setCurrentSection(index);
              if (setCurrentQuestion) setCurrentQuestion(0);
            }}
          />
        </Drawer>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          {/* Progress bar */}
          <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
            <TestProgressBar stats={getTestStats ? getTestStats() : { total: 0, answered: 0, notVisited: 0, visited: 0, markedForReview: 0 }} />
          </Paper>
          
          <Box sx={{ 
            display: 'flex',
            flex: 1, 
            overflow: 'hidden',
            flexDirection: isMobile ? 'column' : 'row',
            gap: 2
          }}>
            {/* Main content area */}
            <Box sx={{ 
              flex: 1, 
              p: isMobile ? 2 : 3, 
              overflow: 'auto',
              order: 1,
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Question Header */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" component="div">
                  Question {questionNumber} of {test?.questions?.length || 0}
                </Typography>
              </Box>

              {/* Question Content */}
              <Paper sx={{ p: 3, mb: 3 }}>
                {question ? (
                  <>
                    <Typography variant="body1" gutterBottom>
                      {question.text}
                    </Typography>
                    
                    {/* Answer Options */}
                    <Box sx={{ mt: 2 }}>
                      {question.options?.map((option, index) => {
                        // Extract option text based on whether it's an object or string
                        const optionText = typeof option === 'object' ? option.text : option;
                        const optionValue = typeof option === 'object' ? option._id : option;
                        
                        return (
                          <FormControlLabel
                            key={index}
                            control={
                              <Radio
                                checked={answers[question._id] === optionValue}
                                onChange={(e) => handleAnswerChange(question._id, optionValue)}
                              />
                            }
                            label={optionText}
                            sx={{ display: 'block', mb: 1 }}
                          />
                        );
                      })}
                    </Box>

                    {/* Mark for Review Button */}
                    <Button
                      variant="outlined"
                      color="warning"
                      onClick={() => markForReview(question._id)}
                      startIcon={<BookmarkIcon />}
                      sx={{ mt: 2 }}
                    >
                      Mark Question {questionNumber} for Review
                    </Button>
                  </>
                ) : (
                  <Typography>Question not available</Typography>
                )}
              </Paper>

              {/* Navigation Buttons */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={prevQuestion}
                  disabled={currentSection === 0 && currentQuestion === 0}
                  startIcon={<ArrowBackIcon />}
                >
                  Previous
                </Button>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  {!isMobile && (
                    <Button
                      variant="contained"
                      color="success"
                      onClick={confirmSubmit}
                      startIcon={<SendIcon />}
                    >
                      Submit Test
                    </Button>
                  )}

                  <Button
                    variant="contained"
                    color="primary"
                    onClick={nextQuestion}
                    disabled={currentSection === test?.sections?.length - 1 && 
                             currentQuestion === (test?.questions?.filter(q => 
                               q.sectionTitle === test?.sections[currentSection]?.title
                             ).length || 0) - 1}
                    endIcon={<ArrowForwardIcon />}
                  >
                    Next
                  </Button>
                </Box>
              </Box>
            </Box>
            
            {/* Question navigation grid - hide by default on mobile */}
            <Paper 
              elevation={1}
              sx={{ 
                width: isMobile ? '100%' : 300,
                height: isMobile ? 'auto' : '100%',
                overflow: 'auto',
                p: 2,
                display: isMobile && !showSidebar ? 'none' : 'block',
                order: isMobile ? 2 : 1,
                maxHeight: isMobile ? '40vh' : 'none',
                borderRadius: 2,
                mt: 2.5
              }}
            >
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                  Questions Navigator
                </Typography>
                <QuestionNavigator 
                  test={test}
                  currentSection={currentSection}
                  currentQuestion={currentQuestion}
                  questionStatus={questionStatus}
                  onQuestionClick={(sectionIndex, questionIndex) => {
                    navigateTo(sectionIndex, questionIndex);
                    if (test.questions) {
                      const sectionQuestions = test.questions.filter(
                        q => q.sectionTitle === test.sections[sectionIndex]?.title
                      );
                      const questionId = sectionQuestions[questionIndex]?._id;
                      if (questionId) {
                        updateQuestionStatus(questionId);
                      }
                    }
                    // On mobile, automatically close the sidebar after selecting a question
                    if (isMobile) {
                      toggleSidebar();
                    }
                  }}
                />
              </Box>
            </Paper>
          </Box>
        </Box>
      </Box>
      
      {/* Mobile navigation buttons */}
      {isMobile && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            display: 'flex',
            gap: 1,
            zIndex: 1000
          }}
        >
          <Fab
            size="medium"
            color="primary"
            onClick={prevQuestion}
            aria-label="Previous Question"
          >
            <NavigateBeforeIcon />
          </Fab>
          <Fab
            size="medium"
            color="primary"
            onClick={nextQuestion}
            aria-label="Next Question"
          >
            <NavigateNextIcon />
          </Fab>
          <Fab
            size="medium"
            color="secondary"
            onClick={toggleSidebar}
            aria-label="Question Navigator"
          >
            {showSidebar ? <CloseIcon /> : <MenuIcon />}
          </Fab>
        </Box>
      )}
      
      {/* Mobile submit button for easy access */}
      {isMobile && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 16,
            left: 16,
            zIndex: 1000
          }}
        >
          <Fab
            variant="extended"
            color="success"
            onClick={confirmSubmit}
            sx={{ px: 2 }}
          >
            Submit Test
          </Fab>
        </Box>
      )}
      
      {/* Submit Modal */}
      <Dialog
        open={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        aria-labelledby="submit-dialog-title"
      >
        <DialogTitle id="submit-dialog-title">
          Confirm Test Submission
        </DialogTitle>
        <DialogContent>
          <DialogContentText component="div">
            Are you sure you want to submit your test? Please review your progress:
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1">Total Questions: {stats.total}</Typography>
              <Typography variant="body1">Answered: {stats.answered}</Typography>
              <Typography variant="body1">Not Visited: {stats.notVisited}</Typography>
              <Typography variant="body1">Marked for Review: {stats.markedForReview}</Typography>
            </Box>
            <Typography color="error" sx={{ mt: 2 }}>
              Note: Once submitted, you cannot make any changes to your answers.
            </Typography>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowSubmitModal(false)} 
            color="primary"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <LoadingButton
            onClick={handleConfirmation}
            color="primary"
            loading={isSubmitting}
            loadingPosition="start"
            startIcon={<SendIcon />}
            variant="contained"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Test'}
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TestAttempt;