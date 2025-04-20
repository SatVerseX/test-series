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
  Fab
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon
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
    setShowSubmitModal
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
  
  // Handle submit button click
  const handleConfirmSubmit = () => {
    confirmSubmit();
  };
  
  // Handle actual submission
  const handleConfirmation = async () => {
    try {
      // Call handleSubmit from context and get the result
      const result = await handleSubmit();
      
      if (result) {
        // Check if this is the special "already submitted" case
        if (result.status === 'already_submitted') {
          // Show appropriate message
          toast.success('Test was already submitted. Viewing results now.');
          
          // Navigate to results page
          setTimeout(() => {
            navigate(`/test-results/${testId}/${user.firebaseId || user.uid}`);
          }, 1000);
          
          return true;
        }
        
        // Regular successful submission
        toast.success('Test submitted successfully!');
        
        // Navigate to results page
        setTimeout(() => {
          navigate(`/test-results/${testId}/${user.firebaseId || user.uid}`);
        }, 1000);
        
        return true;
      } else {
        // Show a helpful error message with diagnostic info
        toast.error(
          'Error submitting test. Your answers have been saved. Please try again or contact support.',
          { autoClose: 7000 }
        );
        
        // Log more diagnostic information
        console.error(`Test submission failed for test ID: ${testId}. Status: Error`);
        
        // Close the submission modal
        setShowSubmitModal(false);
        
        return false;
      }
    } catch (error) {
      // Extract the specific error details
      const errorCode = error.response?.status || 'unknown';
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      
      // Log detailed error information for debugging
      console.error('Error during test submit confirmation:', {
        testId,
        errorCode,
        errorMessage,
        error
      });
      
      // Show a user-friendly error with some diagnostic info
      toast.error(
        `Test submission failed (Error ${errorCode}). Your progress has been saved. You can try again or contact support.`,
        { autoClose: 7000 }
      );
      
      // Close the submission modal
      setShowSubmitModal(false);
      
      return false;
    }
  };
  
  // Handle cancellation of submission
  const handleCancelSubmit = () => {
    setShowSubmitModal(false);
  };
  
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
              {currentQuestionData && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                >
                  <QuestionDisplay 
                    question={currentQuestionData}
                    answer={answers[currentQuestionData._id]}
                    onAnswerChange={(answer) => handleAnswerChange(currentQuestionData._id, answer)}
                    onMarkForReview={() => markForReview(currentQuestionData._id)}
                    status={questionStatus[currentQuestionData._id]}
                    onNext={nextQuestion || (() => {})}
                    onPrev={prevQuestion || (() => {})}
                  />
                </motion.div>
              )}
              
              {/* Desktop navigation and submit */}
              {!isMobile && (
                <Box sx={{ 
                  mt: 3, 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid',
                  borderColor: 'divider',
                  pt: 2
                }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={prevQuestion}
                      startIcon={<NavigateBeforeIcon />}
                      disabled={!prevQuestion}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={nextQuestion}
                      endIcon={<NavigateNextIcon />}
                      disabled={!nextQuestion}
                    >
                      Next
                    </Button>
                  </Box>
                  
                  <Button
                    variant="contained"
                    color="success"
                    size="large"
                    onClick={confirmSubmit}
                    sx={{ px: 4 }}
                  >
                    Submit Test
                  </Button>
                </Box>
              )}
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
      
      {/* Submit confirmation modal */}
      {showSubmitModal && (
        <SubmitConfirmation
          stats={getTestStats()}
          onConfirm={handleConfirmation}
          onCancel={handleCancelSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </Box>
  );
};

export default TestAttempt;