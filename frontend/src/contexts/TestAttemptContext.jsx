import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { auth } from '../config/firebase';

const TestAttemptContext = createContext();

export const useTestAttempt = () => {
  const context = useContext(TestAttemptContext);
  if (!context) {
    console.error('useTestAttempt must be used within a TestAttemptProvider');
    return {
      // Provide default values for critical properties
      test: null,
      loading: false,
      error: 'TestAttempt context not initialized correctly',
      setCurrentTestId: () => console.warn('setCurrentTestId called outside provider'),
      fetchTest: () => console.warn('fetchTest called outside provider'),
      // Include other properties with default values
      currentSection: 0,
      currentQuestion: 0,
      answers: {},
      questionStatus: {},
      timeLeft: 0,
      isSubmitting: false,
      darkMode: false,
      isFullScreen: false,
      showSubmitModal: false,
      showSidebar: true,
      setCurrentSection: () => {},
      setCurrentQuestion: () => {},
      getCurrentQuestion: () => null,
      handleAnswerChange: () => {},
      markForReview: () => {},
      updateQuestionStatus: () => {},
      confirmSubmit: () => console.warn('confirmSubmit called outside provider'),
      handleSubmit: () => console.warn('handleSubmit called outside provider'),
      toggleSidebar: () => {},
      toggleDarkMode: () => {},
      toggleFullScreen: () => {},
      getTestStats: () => ({ total: 0, answered: 0, notVisited: 0, visited: 0, markedForReview: 0 }),
      formatTime: (seconds) => {
        const minutes = Math.floor((seconds || 0) / 60);
        const remainingSeconds = (seconds || 0) % 60;
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
      },
      navigateTo: () => {},
      nextQuestion: () => {},
      prevQuestion: () => {},
      setLoading: () => {},
      setShowSubmitModal: () => {}
    };
  }
  return context;
};

export const TestAttemptProvider = ({ children }) => {
  const { user, api } = useAuth();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [questionStatus, setQuestionStatus] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const saveTimerRef = useRef(null);
  const [currentTestId, setCurrentTestId] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [hasBeenSubmitted, setHasBeenSubmitted] = useState(false);
  const [submitAttempts, setSubmitAttempts] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Question status constants
  const STATUS = {
    NOT_VISITED: 'not-visited',
    VISITED: 'visited',
    ANSWERED: 'answered',
    MARKED_FOR_REVIEW: 'marked-for-review',
  };

  // Fetch test data
  const fetchTest = async (testId) => {
    try {
      setLoading(true);
      setError(null);
      
      // Add retry logic for the fetch test request
      let attempts = 0;
      const maxAttempts = 2; // Reduced from 3 to 2 
      let success = false;
      let lastError = null;
      
      // Set a safety timeout to ensure loading state doesn't persist indefinitely
      const safetyTimeoutId = setTimeout(() => {
        if (loading) {
          console.error('Safety timeout triggered - breaking out of loading state');
          setLoading(false);
          setError('Request timed out. Please try refreshing the page.');
        }
      }, 100000); // 100 seconds absolute maximum
      
      while (attempts < maxAttempts && !success) {
        try {
          console.log(`Attempting to fetch test data (attempt ${attempts + 1}/${maxAttempts})`);
          const response = await api.get(`/api/tests/${testId}`);
          
          if (response.data) {
            console.log('Test data received successfully');
            // Store test data before initializing other state
            const testData = response.data;
            setTest(testData);
            
            // Store the max available time but don't set it yet
            // We'll use saved time from progress if available
            const maxTimeInSeconds = testData.duration * 60;
            
            // Initialize question status - ensure all questions start as NOT_VISITED
            // This is critical for correct stats calculation
            if (testData.questions && Array.isArray(testData.questions)) {
              const initialStatus = {};
              testData.questions.forEach(question => {
                if (question && question._id) {
                  initialStatus[question._id] = STATUS.NOT_VISITED;
                }
              });
              console.log(`Initialized status for ${Object.keys(initialStatus).length} questions`);
              // Reset the question status completely to avoid mixing with old data
              setQuestionStatus(initialStatus);
              
              // Reset answers when loading a new test, but keep them for async loading of saved progress
              const initialAnswers = {};
              setAnswers(initialAnswers);
              
              // Now that test data is available, load saved progress
              // Check for saved progress only if not already loaded
              let savedTimeRestored = false;
              if (!progressLoaded && user) {
                try {
                  // Set a flag to track if we loaded saved time from progress
                  console.log('Loading saved progress after test data is available');
                  savedTimeRestored = await loadSavedProgress(testId, testData);
                } catch (progressError) {
                  console.error('Error loading saved progress, but continuing:', progressError);
                  // Don't fail the whole operation if progress loading fails
                  setProgressLoaded(true);
                }
              }
              
              // Only set the timer to full duration if no saved time was restored
              if (!savedTimeRestored) {
                console.log(`Setting timer to full duration: ${maxTimeInSeconds} seconds`);
                setTimeLeft(maxTimeInSeconds);
              }
            } else {
              console.warn('No valid questions found in test data');
              setQuestionStatus({});
              
              // Set full time if no questions found
              if (testData.duration) {
                setTimeLeft(testData.duration * 60);
              }
            }
            
            success = true;
          } else {
            throw new Error('Test not found');
          }
        } catch (error) {
          lastError = error;
          attempts++;
          
          console.error(`Attempt ${attempts} failed:`, error);
          
          if (attempts < maxAttempts) {
            const waitTime = attempts * 2000;
            console.log(`Retrying test data fetch in ${waitTime / 1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      }
      
      // Clear the safety timeout since we're exiting normally
      clearTimeout(safetyTimeoutId);
      
      if (!success) {
        throw lastError || new Error('Failed to load test after multiple attempts');
      }
    } catch (error) {
      console.error('Error fetching test:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load test. Please try again.';
      setError(errorMessage);
      
      // Log detailed error information for debugging
      console.error('Detailed error info:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        code: error.code
      });
    } finally {
      setLoading(false);
    }
  };

  // Get current question
  const getCurrentQuestion = () => {
    if (!test || !test.sections || currentSection >= test.sections.length) {
      return null;
    }
    
    // Get questions for current section
    const sectionTitle = test.sections[currentSection].title;
    const sectionQuestions = test.questions.filter(q => q.sectionTitle === sectionTitle);
    
    if (currentQuestion >= sectionQuestions.length) {
      return null;
    }
    
    return sectionQuestions[currentQuestion];
  };

  // Load saved progress
  const loadSavedProgress = async (testId, testData) => {
    if (!user || progressLoaded) return false;

    // Add loading lock to prevent race conditions
    if (window._loadingProgress) {
      console.warn('Progress load already in progress, skipping');
      return false;
    }
    window._loadingProgress = true;

    try {
      const userId = user.firebaseId || user.uid || (typeof user === 'string' ? user : null);
      if (!userId) {
        console.error('No valid user ID found for API call');
        return false;
      }
      
      const currentTest = testData || test;
      if (!currentTest?.questions?.length) {
        console.warn('Cannot load progress: test data is not available');
        return false;
      }

      const validQuestionIds = new Set(currentTest.questions.map(q => q._id).filter(Boolean));
      if (!validQuestionIds.size) {
        console.warn('No valid question IDs found in test data');
        return false;
      }

      console.log(`Loading progress for test ${testId} with ${validQuestionIds.size} valid questions`);

      // Create axios instance with retry logic
      const silentAxios = axios.create({
        baseURL: api.defaults.baseURL,
        headers: api.defaults.headers,
        timeout: 10000 // 10 second timeout
      });

      // Add retry interceptor
      silentAxios.interceptors.response.use(null, async (error) => {
        if (error.response?.status === 404) {
          return { status: 404, data: null };
        }
        
        const config = error.config;
        config.retryCount = config.retryCount || 0;
        
        if (config.retryCount < 2 && error.response?.status >= 500) {
          config.retryCount++;
          await new Promise(resolve => setTimeout(resolve, 1000 * config.retryCount));
          return silentAxios(config);
        }
        return Promise.reject(error);
      });

      // Add auth interceptor
      silentAxios.interceptors.request.use(async (config) => {
        try {
          const user = auth.currentUser;
          if (user) {
            const token = await user.getIdToken(true); // Force refresh token
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (e) {
          console.warn('Auth error in progress load:', e);
        }
        return config;
      });
      
      const response = await silentAxios.get(`/api/tests/${testId}/progress/${userId}`);
        
      if (response.status === 404) {
        console.log(`No saved progress found for test ${testId}`);
        return false;
      }
        
      if (!response.data) {
        console.warn('Invalid progress data received');
        return false;
      }

      let timerRestored = false;
        
      // Validate and restore timer
      if (typeof response.data.timeLeft === 'number' && response.data.timeLeft > 0) {
        console.log(`Restoring timer: ${response.data.timeLeft}s`);
        const maxAllowedTime = currentTest.duration ? currentTest.duration * 60 : Infinity;
        const newTime = Math.min(response.data.timeLeft, maxAllowedTime);
        
        if (newTime !== response.data.timeLeft) {
          console.warn(`Adjusted time from ${response.data.timeLeft}s to ${newTime}s`);
        }
        
        setTimeLeft(newTime);
        timerRestored = true;
      }

      // Initialize question status for all questions
      const initialStatus = {};
      currentTest.questions.forEach(question => {
        if (question && question._id) {
          initialStatus[question._id] = STATUS.NOT_VISITED;
        }
      });
      
      // Validate and restore answers
      if (response.data.answers && typeof response.data.answers === 'object') {
        const validAnswers = {};
        let invalidCount = 0;
        
        Object.entries(response.data.answers).forEach(([qId, answer]) => {
          if (validQuestionIds.has(qId) && answer !== null && answer !== undefined) {
            validAnswers[qId] = answer;
            // Update status for answered questions
            initialStatus[qId] = STATUS.ANSWERED;
          } else {
            invalidCount++;
          }
        });

        if (invalidCount > 0) {
          console.warn(`Filtered out ${invalidCount} invalid answers`);
        }

        // Set answers first
        if (Object.keys(validAnswers).length > 0) {
          setAnswers(validAnswers);
          console.log(`Restored ${Object.keys(validAnswers).length} valid answers`);
        }
      }

      // Restore marked for review status if available
      if (response.data.markedForReview && Array.isArray(response.data.markedForReview)) {
        response.data.markedForReview.forEach(qId => {
          if (validQuestionIds.has(qId)) {
            initialStatus[qId] = STATUS.MARKED_FOR_REVIEW;
          }
        });
      }

      // Set visited status for questions that were viewed but not answered
      if (response.data.visited && Array.isArray(response.data.visited)) {
        response.data.visited.forEach(qId => {
          if (validQuestionIds.has(qId) && initialStatus[qId] === STATUS.NOT_VISITED) {
            initialStatus[qId] = STATUS.VISITED;
          }
        });
      }

      // Set the question status after all updates
      setQuestionStatus(initialStatus);
      console.log('Question status restored:', initialStatus);
      
      setProgressLoaded(true);
      return timerRestored;
    } catch (error) {
      console.error('Error loading progress:', error);
      if (error.response) {
        console.error('Response error:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      }
      return false;
    } finally {
      window._loadingProgress = false;
    }
  };

  // Save progress function with optimized payload
  const saveAnswers = async (testId = null) => {
    if (!user) {
      console.warn('Cannot save answers: no user logged in');
      return false;
    }
    
    const id = testId || currentTestId;
    if (!id) {
      console.error('No test ID available for saving progress');
      return false;
    }
    
    try {
      // Get valid question IDs from the test
      const validQuestionIds = test.questions.map(q => q._id).filter(Boolean);
      
      // Filter answers to only include valid questions from this test
      const validAnswers = {};
      let validAnswerCount = 0;
      
      // Collect marked for review questions
      const markedForReview = [];
      // Collect visited questions
      const visited = [];
      
      Object.entries(questionStatus).forEach(([qId, status]) => {
        if (validQuestionIds.includes(qId)) {
          if (status === STATUS.MARKED_FOR_REVIEW) {
            markedForReview.push(qId);
          } else if (status === STATUS.VISITED) {
            visited.push(qId);
          }
        }
      });
      
      for (const [qId, answer] of Object.entries(answers)) {
        if (!validQuestionIds.includes(qId)) continue;
        
        if (answer !== undefined && answer !== null && answer !== '') {
          validAnswers[qId] = answer;
          validAnswerCount++;
        }
      }
      
      console.log(`Saving progress with ${validAnswerCount} answers, ${markedForReview.length} marked, ${visited.length} visited`);
      
      // Create payload with all progress information
      const payload = {
        answers: validAnswers,
        timeLeft,
        markedForReview,
        visited
      };
      
      const response = await api.post(`/api/tests/${id}/save-progress`, payload);
      
      if (response.data) {
        console.log('Progress saved successfully');
        return true;
      }
    } catch (error) {
      console.error('Error saving progress:', error);
      return false;
    }
  };

  // Handle answer change
  const handleAnswerChange = (questionId, answer) => {
    // Add debug logging to check what's being stored
    console.debug(`Storing answer for question ${questionId}:`, 
      typeof answer === 'object' ? JSON.stringify(answer) : answer
    );
    
    // Ensure the answer is in the correct format before storing
    let formattedAnswer = answer;
    
    // Check if question exists in the test data
    const questionData = test?.questions.find(q => q._id === questionId);
    
    if (questionData) {
      // Format answer based on question type
      if (questionData.type === 'multiple_select' && Array.isArray(answer)) {
        // Convert array to comma-separated string for multiple select
        formattedAnswer = answer.join(',');
      } else if ((questionData.type === 'mcq' || questionData.type === 'multiple_choice' || 
                 questionData.type === 'trueFalse') && typeof answer === 'string') {
        // Ensure string type for single-choice questions
        formattedAnswer = answer;
      } else if (questionData.type === 'integer' && answer !== '') {
        // Convert to number for integer questions
        formattedAnswer = parseInt(answer, 10);
        if (isNaN(formattedAnswer)) formattedAnswer = '';
      } else if (questionData.type === 'matching' && typeof answer === 'object') {
        // Keep object type for matching questions
        formattedAnswer = answer;
      }
    }
    
    // Update the answers state
    setAnswers(prev => ({ ...prev, [questionId]: formattedAnswer }));
    
    // Only update status to ANSWERED if the answer has a value
    if (answer !== undefined && answer !== null && answer !== '') {
      setQuestionStatus(prev => ({ ...prev, [questionId]: STATUS.ANSWERED }));
    } else {
      // If answer is cleared, change status to VISITED
      setQuestionStatus(prev => {
        // Only change if it was previously marked as ANSWERED
        if (prev[questionId] === STATUS.ANSWERED) {
          return { ...prev, [questionId]: STATUS.VISITED };
        }
        return prev;
      });
    }
  };

  // Mark question for review
  const markForReview = (questionId) => {
    setQuestionStatus(prev => ({ ...prev, [questionId]: STATUS.MARKED_FOR_REVIEW }));
  };

  // Update question status when visited
  const updateQuestionStatus = (questionId) => {
    // Only update if not already answered or marked for review
    setQuestionStatus(prev => {
      if (prev[questionId] === STATUS.NOT_VISITED) {
        return { ...prev, [questionId]: STATUS.VISITED };
      }
      return prev;
    });
  };

  // Navigate to next question
  const nextQuestion = () => {
    if (!test) return;
    
    const currentSectionQuestions = test.questions.filter(
      q => q.sectionTitle === test.sections[currentSection]?.title
    );
    
    if (currentQuestion < currentSectionQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else if (currentSection < test.sections.length - 1) {
      setCurrentSection(currentSection + 1);
      setCurrentQuestion(0);
    }
  };

  // Navigate to previous question
  const prevQuestion = () => {
    if (!test) return;
    
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    } else if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
      const prevSectionQuestions = test.questions.filter(
        q => q.sectionTitle === test.sections[currentSection - 1]?.title
      );
      setCurrentQuestion(prevSectionQuestions.length - 1);
    }
  };

  // Navigate to specific section and question
  const navigateTo = (sectionIndex, questionIndex) => {
    setCurrentSection(sectionIndex);
    setCurrentQuestion(questionIndex);
  };

  // Submit the test
  const submitTest = async () => {
    if (isSubmitting || hasBeenSubmitted) {
      console.log('Test submission already in progress or previously completed');
      toast.warning('Submission already in progress or test already submitted');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Save final answers before submission
      await saveAnswers();
      
      console.log(`Submitting test ${currentTestId} with ${Object.keys(answers).length} answers`);
      
      // Get current user token
      const user = auth.currentUser;
      if (!user) {
        setSubmitError('Authentication required to submit test');
        toast.error('Please login again to submit the test');
        setIsSubmitting(false);
        return;
      }

      const token = await user.getIdToken(true);
      if (!token) {
        setSubmitError('Authentication token not found');
        toast.error('Please login again to submit the test');
        setIsSubmitting(false);
        return;
      }
      
      // Get the attempt ID from localStorage if available
      const attemptId = localStorage.getItem(`test_${currentTestId}_attempt_id`);
      
      // Create submission payload
      const payload = {
        answers,
        attemptId,
        timeLeft,
        testId: currentTestId,
        userId: user.uid
      };

      // Make the submission request using axios instead of fetch
      const response = await api.post(`/api/tests/${currentTestId}/submit`, payload);
      
      // Handle successful submission
      console.log('Submission response:', response.data);
      setHasBeenSubmitted(true);
      toast.success('Test submitted successfully!');
      
      // Store the attempt ID
      const attemptIdFromResponse = response.data?.attempt?.id;
      if (attemptIdFromResponse) {
        localStorage.setItem(`test_${currentTestId}_attempt_id`, attemptIdFromResponse);
        
        // Clear test data from localStorage
        localStorage.removeItem(`test_${currentTestId}_answers`);
        localStorage.removeItem(`test_${currentTestId}_startTime`);
        
        // Redirect to results page using the correct route format
        const userId = user.uid;
        window.location.href = `/test-results/${currentTestId}/${userId}`;
      } else {
        console.error('No attempt ID received in response');
        toast.error('Error accessing results. Redirecting to tests page...');
        window.location.href = '/tests';
      }
      
      return response.data;
      
    } catch (error) {
      console.error('Error during test submission:', error);
      
      // Handle different types of errors
      if (error.response) {
        // Server responded with error
        const status = error.response.status;
        const errorMessage = error.response.data?.message || 'Unknown error occurred';
        
        if (status === 409) {
          // Test already submitted
          setHasBeenSubmitted(true);
          toast.info('This test was already submitted');
          
          // Try to redirect to results
          const attemptId = error.response.data?.attempt?.id || 
                          localStorage.getItem(`test_${currentTestId}_attempt_id`);
          
          if (attemptId) {
            window.location.href = `/tests-results/${currentTestId}/${attemptId}`;
            return;
          }
        } else if (status === 401 || status === 403) {
          setSubmitError('Not authorized to submit this test');
          toast.error('Please login again to submit the test');
        } else if (status === 404) {
          setSubmitError('Test not found');
          toast.error('The test you are trying to submit could not be found');
        } else {
          setSubmitError(errorMessage);
          toast.error(`Submission failed: ${errorMessage}`);
        }
      } else if (error.request) {
        // Request made but no response
        setSubmitError('Network error occurred');
        toast.error('Network error. Please check your connection and try again');
      } else {
        // Error in request setup
        setSubmitError(error.message || 'Failed to submit test');
        toast.error(error.message || 'Failed to submit test');
      }
      
      return null;
    } finally {
      setIsSubmitting(false);
      setShowSubmitModal(false);
    }
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  // Toggle fullscreen
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullScreen(!isFullScreen);
  };

  // Get test statistics
  const getTestStats = () => {
    if (!test) return { total: 0, answered: 0, notVisited: 0, visited: 0, markedForReview: 0 };
    
    const total = test.questions.length;
    let answered = 0;
    let notVisited = 0;
    let visited = 0;
    let markedForReview = 0;
    
    try {
      // Check for valid question status object
      if (!questionStatus || typeof questionStatus !== 'object') {
        console.warn('Invalid question status object in getTestStats');
        // Default values for safety
        notVisited = total;
        return { total, answered: 0, notVisited, visited: 0, markedForReview: 0 };
      }
      
      // Get all valid test question IDs to ensure we only count real questions
      const validQuestionIds = test.questions.map(q => q._id).filter(Boolean);
      
      // Get question IDs that have been actually answered (have values in the answers object)
      const actuallyAnsweredQuestionIds = Object.keys(answers).filter(qId => {
        // Only count answers for questions that exist in this test
        if (!validQuestionIds.includes(qId)) return false;
        
        // Skip internal properties and ensure the answer has a value
        return !qId.startsWith('$') && !qId.startsWith('_') && 
               answers[qId] !== undefined && answers[qId] !== null && answers[qId] !== '';
      });
      
      // Log for debugging
      console.debug('Actually answered questions:', actuallyAnsweredQuestionIds.length);
      
      // Use Object.entries safely and validate each status
      for (const questionId of validQuestionIds) {
        const status = questionStatus[questionId];
        
        // Skip invalid statuses
        if (!status || typeof status !== 'string' || !Object.values(STATUS).includes(status)) {
          notVisited++;
          continue;
        }
        
        // Determine if this question is actually answered
        const isActuallyAnswered = actuallyAnsweredQuestionIds.includes(questionId);
        
        // Only count as answered if it both has ANSWERED status AND has a value in the answers object
        if (status === STATUS.ANSWERED && isActuallyAnswered) {
          answered++;
        } else if (status === STATUS.MARKED_FOR_REVIEW) {
          markedForReview++;
        } else if (status === STATUS.VISITED) {
          visited++;
        } else if (status === STATUS.NOT_VISITED) {
          notVisited++;
        } else if (status === STATUS.ANSWERED && !isActuallyAnswered) {
          // If marked as answered but no actual answer, count as visited
          visited++;
        } else {
          // Unrecognized status, count as not visited
          notVisited++;
        }
      }
      
      // Safety check: ensure counts don't exceed total question count
      answered = Math.min(answered, total);
      notVisited = Math.min(notVisited, total);
      visited = Math.min(visited, total);
      markedForReview = Math.min(markedForReview, total);
      
      // Ensure total count is accurate
      const totalCounted = answered + notVisited + visited + markedForReview;
      if (totalCounted > total) {
        // Redistribute the overflow
        const overflow = totalCounted - total;
        // Reduce counts proportionally, starting with notVisited
        if (notVisited > overflow) {
          notVisited -= overflow;
        } else {
          const remaining = overflow - notVisited;
          notVisited = 0;
          // Try to reduce visited next
          if (visited > remaining) {
            visited -= remaining;
          } else {
            // As a last resort, reduce answered
            const finalRemaining = remaining - visited;
            visited = 0;
            answered = Math.max(0, answered - finalRemaining);
          }
        }
      } else if (totalCounted < total) {
        // If we're missing counts, add to notVisited
        notVisited += (total - totalCounted);
      }
      
      // Final validation to ensure counts make sense
      const stats = {
        total,
        answered: Math.min(answered, total),
        notVisited: Math.min(notVisited, total),
        visited: Math.min(visited, total),
        markedForReview: Math.min(markedForReview, total)
      };
      
      // Debug to check the stats
      console.debug('Final test stats:', stats);
      
      return stats;
    } catch (error) {
      console.error('Error calculating test stats:', error);
      // Reset to default values on error
      notVisited = total;
      answered = visited = markedForReview = 0;
      return { total, answered, notVisited, visited, markedForReview };
    }
  };

  // Format time to display (e.g. 60:00)
  const formatTime = (seconds) => {
    if (typeof seconds !== 'number' || isNaN(seconds)) {
      return '0:00';
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setShowSidebar(prev => !prev);
  };

  // Handle confirm submit (show modal)
  const confirmSubmit = () => {
    setShowSubmitModal(true);
  };

  // Handle submit with retry logic
  const handleSubmit = async () => {
    if (isSubmitting) {
      console.log('Test is already being submitted');
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading('Submitting test...');

    try {
      // Validate we have a test ID
      if (!currentTestId) {
        throw new Error('No test ID available');
      }

      // Get final test stats before submission
      const finalStats = getTestStats();
      console.log('Submitting test with stats:', finalStats);

      // Create submission payload
      const payload = {
        answers,
        timeLeft,
        testId: currentTestId
      };

      try {
        // Make the submission request
        const response = await api.post(`/api/tests/${currentTestId}/submit`, payload);
        
        if (response.data && response.data.attempt) {
          // Handle successful submission
          console.log('Submission successful:', response.data);
          toast.dismiss(loadingToast);
          toast.success('Test submitted successfully!');
          
          // Clear test data from localStorage
          localStorage.removeItem(`test_${currentTestId}_answers`);
          localStorage.removeItem(`test_${currentTestId}_time`);
          localStorage.removeItem(`test_${currentTestId}_status`);
          
          return response.data;
        } else {
          throw new Error('Invalid response format from server');
        }
      } catch (error) {
        // Handle specific error cases
        if (error.response?.status === 409) {
          // Test already submitted
          toast.dismiss(loadingToast);
          toast.info('This test was already submitted');
          return error.response.data;
        }
        
        if (error.response?.status === 401) {
          // Authentication error
          toast.dismiss(loadingToast);
          toast.error('Your session has expired. Please log in again.');
          throw new Error('Authentication failed');
        }
        
        if (error.response?.status === 500) {
          toast.dismiss(loadingToast);
          toast.error('Server error. Please try again.');
          throw new Error('Server error occurred');
        }
        
        // For other errors, throw them to be caught by the outer try-catch
        throw error;
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.dismiss(loadingToast);
      toast.error(error.message || 'Failed to submit test. Please try again.');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // We don't need an automatic effect to fetch test data
  // It will be called explicitly when needed
  useEffect(() => {
    return () => {
      if (saveTimerRef && saveTimerRef.current) {
        clearInterval(saveTimerRef.current);
      }
    };
  }, []);

  // Add effect to fetch test when currentTestId changes
  useEffect(() => {
    if (currentTestId) {
      fetchTest(currentTestId);
    }
  }, [currentTestId, user?.firebaseId]);

  // Set up periodic saving of answers
  useEffect(() => {
    if (currentTestId && user && Object.keys(answers).length > 0) {
      // Save answers every 30 seconds
      saveTimerRef.current = setInterval(() => {
        saveAnswers(currentTestId);
      }, 30000);
      
      return () => {
        if (saveTimerRef.current) {
          clearInterval(saveTimerRef.current);
          saveTimerRef.current = null;
        }
      };
    }
  }, [currentTestId, answers, user]);
  
  // Save progress when timer changes significantly (every minute)
  useEffect(() => {
    // Only save when time decreases by a significant amount (every minute)
    if (currentTestId && user && timeLeft > 0 && timeLeft % 60 === 0) {
      saveAnswers(currentTestId);
    }
  }, [timeLeft, currentTestId, user]);

  // Save progress when user is about to leave the page
  useEffect(() => {
    if (!currentTestId || !user) return;
    
    const handleBeforeUnload = async (e) => {
      e.preventDefault();
      
      // Standard message for most browsers
      e.returnValue = "Your test progress will be saved, but you should continue without refreshing.";
      
      // Try to save progress before the page unloads
      try {
        await saveAnswers(currentTestId);
      } catch (error) {
        console.error('Error saving progress before unload:', error);
      }
      
      return e.returnValue;
    };
    
    // Add event listener for beforeunload
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentTestId, user, timeLeft]);

  const value = {
    test,
    loading,
    error,
    currentSection,
    currentQuestion,
    answers,
    questionStatus,
    timeLeft,
    setTimeLeft,
    isSubmitting,
    darkMode,
    isFullScreen,
    STATUS,
    fetchTest,
    saveAnswers,
    handleAnswerChange,
    markForReview,
    updateQuestionStatus,
    nextQuestion,
    prevQuestion,
    navigateTo,
    submitTest,
    toggleDarkMode,
    toggleFullScreen,
    getTestStats,
    currentTestId,
    setCurrentTestId,
    getCurrentQuestion,
    setLoading,
    formatTime,
    confirmSubmit,
    handleSubmit,
    showSubmitModal,
    setShowSubmitModal,
    showSidebar,
    toggleSidebar,
    submitError
  };

  return (
    <TestAttemptContext.Provider value={value}>
      {children}
    </TestAttemptContext.Provider>
  );
}; 