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
    if (!user || progressLoaded) return false; // Return false if no progress loaded
    
    try {
      // Get the user ID to use in the API call
      const userId = user.firebaseId || user.uid || (typeof user === 'string' ? user : null);
      if (!userId) {
        console.error('No valid user ID found for API call');
        return false;
      }
      
      // Use passed testData or the current test state
      const currentTest = testData || test;
      
      // Only continue if we have test data with questions
      if (!currentTest || !currentTest.questions || !currentTest.questions.length) {
        console.warn('Cannot load progress: test data is not available');
        return false;
      }
      
      // Get list of valid question IDs
      const validQuestionIds = currentTest.questions.map(q => q._id).filter(Boolean);
      if (!validQuestionIds.length) {
        console.warn('No valid question IDs found in test data');
        return false;
      }
      
      console.log(`Attempting to load progress for test ${testId} with ${validQuestionIds.length} valid questions`);
      
      // Create a custom axios instance just for progress loading to silently handle 404s
      const silentAxios = axios.create({
        baseURL: api.defaults.baseURL,
        headers: api.defaults.headers
      });
      
      // Clone the auth interceptor from the main api instance
      silentAxios.interceptors.request.use(async (config) => {
        // Copy auth headers from the main api instance if possible
        try {
          const user = auth.currentUser;
          if (user) {
            const token = await user.getIdToken();
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (e) {
          // Silently handle auth errors - will fall back to no auth
        }
        return config;
      });
      
      // Add a response interceptor to silently handle 404s
      silentAxios.interceptors.response.use(
        (response) => response,
        (error) => {
          // If it's a 404, resolve with a custom response instead of rejecting
          if (error.response && error.response.status === 404) {
            return Promise.resolve({ 
              status: 404, 
              data: null,
              config: error.config,
              headers: error.response.headers,
              statusText: 'Not Found'
            });
          }
          
          // Otherwise, reject normally
          return Promise.reject(error);
        }
      );
      
      // Use the silent axios instance for the call
      const response = await silentAxios.get(`/api/tests/${testId}/progress/${userId}`);
        
      // If the status is 404, consider it "no progress" (not an error)
      if (response.status === 404) {
        // Don't log anything to keep the console clean
        console.log(`No saved progress found for test ${testId}`);
        return false;
      }
        
      // Track if timer was restored
      let timerRestored = false;
        
      // Otherwise, continue with setting the answers and timer state
      if (response.data) {
        console.log(`Found saved progress for test ${testId}`, response.data);
        
        // Restore the timer if it exists in the saved progress
        if (response.data.timeLeft !== undefined && response.data.timeLeft > 0) {
          console.log(`Restoring timer from saved progress: ${response.data.timeLeft} seconds`);
          
          // Make sure we don't give more time than the total test duration
          if (currentTest && currentTest.duration) {
            const maxAllowedTime = currentTest.duration * 60;
            // If saved time is greater than max allowed time, use max allowed time
            if (response.data.timeLeft > maxAllowedTime) {
              console.warn(`Saved time (${response.data.timeLeft}s) exceeds test duration (${maxAllowedTime}s). Using maximum allowed time.`);
              setTimeLeft(maxAllowedTime);
            } else {
              setTimeLeft(response.data.timeLeft);
            }
          } else {
            // If we can't validate against test duration, just set the saved time
            setTimeLeft(response.data.timeLeft);
          }
          timerRestored = true;
        }
        
        // Restore saved answers
        if (response.data.answers) {
          // Filter out invalid answers and parse any serialized objects
          const validAnswers = {};
          let savedAnswerCount = 0;
          let invalidAnswerCount = 0;
          
          Object.entries(response.data.answers).forEach(([questionId, answer]) => {
            // Skip any internal properties, empty answers, or answers for questions not in this test
            if (!questionId.startsWith('$') && !questionId.startsWith('_') && 
                validQuestionIds.includes(questionId) &&
                answer !== undefined && answer !== null && answer !== '') {
              
              savedAnswerCount++;
              
              // Try to parse any stringified objects
              if (typeof answer === 'string' && 
                  (answer.startsWith('{') || answer.startsWith('['))) {
                try {
                  validAnswers[questionId] = JSON.parse(answer);
                } catch (e) {
                  // If parsing fails, use the original string
                  validAnswers[questionId] = answer;
                }
              } else {
                validAnswers[questionId] = answer;
              }
            } else {
              invalidAnswerCount++;
            }
          });
          
          // Only update with valid answers
          if (Object.keys(validAnswers).length > 0) {
            console.log(`Loading ${Object.keys(validAnswers).length} saved answers (ignored ${invalidAnswerCount} invalid answers)`);
            setAnswers(validAnswers);
            
            // Update question status for answered questions
            const updatedStatus = { ...questionStatus };
            Object.keys(validAnswers).forEach(questionId => {
              updatedStatus[questionId] = STATUS.ANSWERED;
            });
            setQuestionStatus(updatedStatus);
          } else {
            console.warn('No valid answers found in saved progress');
          }
        }
        
        // Log when the progress was last saved
        if (response.data.saveTimestamp) {
          const savedTime = new Date(response.data.saveTimestamp);
          const now = new Date();
          const timeDiffMinutes = Math.floor((now - savedTime) / (1000 * 60));
          console.log(`Test progress was last saved ${timeDiffMinutes} minutes ago`);
        }
      }
      
      setProgressLoaded(true);
      return timerRestored; // Return whether timer was restored
    } catch (error) {
      // This should only happen for network errors or other serious issues
      // Don't log 404 errors
      if (!(error.response && error.response.status === 404)) {
        console.error('Critical error loading saved progress:', error);
      }
      // Non-critical error, can continue without saved progress
      setProgressLoaded(true);
      return false; // Return false as timer was not restored
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
    
    // Only save if we have actual answers to save and test data is available
    if (Object.keys(answers).length === 0 || !test || !test.questions) {
      console.log('No answers to save yet or test data not available');
      return false;
    }
    
    try {
      // Get valid question IDs from the test to filter answers
      const validQuestionIds = test.questions.map(q => q._id).filter(Boolean);
      
      // Filter answers to only include valid questions from this test
      const validAnswers = {};
      let validAnswerCount = 0;
      
      for (const [qId, answer] of Object.entries(answers)) {
        // Only include answers for questions that exist in this test
        if (!validQuestionIds.includes(qId)) continue;
        
        // Include non-empty answers of any type
        if (answer !== undefined && answer !== null && answer !== '') {
          // Convert all answers to string format for consistent storage
          if (typeof answer === 'object') {
            validAnswers[qId] = JSON.stringify(answer);
          } else {
            validAnswers[qId] = String(answer);
          }
          validAnswerCount++;
        }
      }
      
      // Log the actual number of valid answers
      console.log(`Saving progress with ${validAnswerCount} valid answers out of ${Object.keys(answers).length} total answers`);
      
      // If no valid answers, skip the save
      if (validAnswerCount === 0) {
        console.log('No valid answers to save');
        return false;
      }
      
      // Create an efficient payload for saving
      // Limit to 100 answers per save to prevent document size issues
      const cleanAnswers = {};
      let answerCount = 0;
      
      for (const [qId, answer] of Object.entries(validAnswers)) {
        cleanAnswers[qId] = answer;
        answerCount++;
        
        if (answerCount >= 100) {
          break;
        }
      }
      
      // Also save the current time left
      const payload = {
        answers: cleanAnswers,
        timeLeft: timeLeft
      };
      
      // Save current progress
      const response = await api.post(
        `/api/tests/${id}/save-progress`,
        payload
      );
      
      if (response.data) {
        console.log(`Progress saved successfully. Server response:`, response.data);
        
        // If we have more answers to save, recurse with the remaining answers
        const remainingCount = validAnswerCount - answerCount;
        if (remainingCount > 0) {
          // Remove saved answers
          const remainingAnswers = {...validAnswers};
          Object.keys(cleanAnswers).forEach(qId => delete remainingAnswers[qId]);
          
          // Update answers with remaining only, keeping invalid answers to avoid losing data
          const newAnswers = {...answers};
          Object.keys(answers).forEach(qId => {
            if (validQuestionIds.includes(qId) && !Object.keys(remainingAnswers).includes(qId)) {
              delete newAnswers[qId];
            }
          });
          setAnswers(newAnswers);
          
          // Wait a short time to avoid overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Recursively save remaining answers
          return saveAnswers(id);
        }
        
        // Clean up any invalid answers from the state
        if (Object.keys(answers).length > validAnswerCount) {
          console.log(`Cleaning up ${Object.keys(answers).length - validAnswerCount} invalid answers from state`);
          const cleanedAnswers = {};
          for (const [qId, answer] of Object.entries(answers)) {
            if (validQuestionIds.includes(qId)) {
              cleanedAnswers[qId] = answer;
            }
          }
          setAnswers(cleanedAnswers);
        }
        
        // All answers saved successfully
        // Mark progress as saved
        setProgressLoaded(true);
        return true;
      }
    } catch (error) {
      console.error('Error saving progress:', error);
      
      // Don't show toast for every autosave error to avoid spamming the user
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

  // Submit test
  const submitTest = async (testId = null) => {
    const id = testId || currentTestId;
    if (isSubmitting || !user || !test || !id) return;
    
    setIsSubmitting(true);
    try {
      const userId = user.firebaseId || user.uid;
      if (!userId) {
        throw new Error('No valid user ID found for test submission');
      }

      // Save progress one last time before submitting
      try {
        await saveAnswers(id);
      } catch (saveError) {
        console.warn('Error saving final progress before submission, continuing anyway:', saveError);
      }

      // Format answers based on question types using a clean approach
      const safeAnswers = {};
      
      test.questions.forEach(question => {
        // Skip if question has no ID or ID is not valid
        if (!question._id || 
            typeof question._id !== 'string' || 
            question._id.includes('$') || 
            question._id.includes('.') || 
            question._id.startsWith('_')) {
          return;
        }
        
        const userAnswer = answers[question._id];
        if (userAnswer === undefined || userAnswer === null || userAnswer === '') return;
        
        // Handle different question types accordingly
        try {
          if (question.type === 'integer') {
            // Convert to string to ensure MongoDB compatibility
            safeAnswers[question._id] = String(parseInt(userAnswer));
          } else if (question.type === 'trueFalse') {
            safeAnswers[question._id] = String(userAnswer).toLowerCase();
          } else if (question.type === 'multiple_select') {
            // Multiple select answers are comma-separated strings of option IDs
            if (Array.isArray(userAnswer)) {
              safeAnswers[question._id] = userAnswer.join(',');
            } else {
              safeAnswers[question._id] = String(userAnswer);
            }
          } else if (question.type === 'mcq' || question.type === 'multiple_choice') {
            // MCQ answers could be option IDs if options are objects
            safeAnswers[question._id] = String(userAnswer);
          } else if (question.type === 'matching' && typeof userAnswer === 'object') {
            // Clean the matching answers to remove any internal properties
            try {
              // First create a clean array without any internal properties
              const cleanArray = Array.isArray(userAnswer) ? 
                userAnswer.map(item => {
                  if (typeof item !== 'object' || item === null) return item;
                  
                  // Only include safe properties
                  const cleanItem = {};
                  Object.keys(item).forEach(key => {
                    if (!key.startsWith('$') && !key.startsWith('_')) {
                      cleanItem[key] = item[key];
                    }
                  });
                  return cleanItem;
                }) : [];
          
              safeAnswers[question._id] = JSON.stringify(cleanArray);
            } catch (e) {
              console.warn(`Could not stringify matching answer for ${question._id}:`, e);
            }
          } else {
            // For all other types, convert to string
            safeAnswers[question._id] = String(userAnswer);
          }
        } catch (formatError) {
          console.error(`Error formatting answer for question ${question._id}:`, formatError);
          // Skip this answer rather than failing the entire submission
        }
      });
      
      console.log(`Submitting test with ${Object.keys(safeAnswers).length} clean answers`);
      
      // Check if we have any answers to submit
      if (Object.keys(safeAnswers).length === 0) {
        console.warn('No valid answers to submit - this will result in a zero score');
      }
      
      // Create the payload for submission
      const payload = {
        userId: userId,
        answers: safeAnswers,
        timeTaken: Math.max(test.duration * 60 - timeLeft, 0)
      };
      
      // Log the request payload for debugging
      console.log('Test submission payload:', {
        testId: id,
        userId,
        answersCount: Object.keys(safeAnswers).length,
        timeTaken: payload.timeTaken
      });
      
      try {
        const response = await api.post(
          `/api/tests/${id}/attempt`,
          payload,
          {
            retry: 3,
            retryDelay: 1500,
            timeout: 15000 // Increase timeout to 15 seconds
          }
        );
        
        return response.data;
      } catch (submitError) {
        // Extract more detailed error information
        const statusCode = submitError.response?.status;
        const errorMessage = submitError.response?.data?.message || submitError.message;
        
        console.error('Error submitting test:', {
          statusCode,
          errorMessage,
          testId: id,
          error: submitError
        });
        
        // Try to get a more detailed error message from the server response
        if (submitError.response?.data) {
          console.error('Server error details:', submitError.response.data);
          
          // Check for MongoDB duplicate key error
          const errorText = submitError.response.data.error || '';
          if (errorText.includes('E11000 duplicate key error')) {
            console.log('Detected MongoDB duplicate key error - test was already submitted');
            
            // Create a special error object to signal this is a duplicate submission
            const duplicateError = new Error('Test already submitted');
            duplicateError.isDuplicateSubmission = true;
            duplicateError.originalError = submitError;
            throw duplicateError;
          }
        }
        
        throw submitError;
      }
    } catch (error) {
      console.error('Error submitting test:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
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

  // Handle submit
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setShowSubmitModal(false);
      
      // Try to submit test with retry logic
      let attempts = 0;
      const maxAttempts = 3;
      let result = null;
      let lastError = null;
      
      while (attempts < maxAttempts && !result) {
        try {
          console.log(`Submitting test attempt ${attempts + 1}/${maxAttempts}`);
          result = await submitTest();
          if (result) {
            console.log('Test submitted successfully:', result);
            break;
          }
        } catch (error) {
          // Get more specific error information
          const statusCode = error.response?.status;
          const errorDetails = error.response?.data?.message || error.message || 'Unknown error';
          
          console.error(`Error during attempt ${attempts + 1}:`, {
            statusCode,
            errorDetails,
            error
          });
          
          // Check if this is a duplicate submission error (test already submitted)
          if (error.isDuplicateSubmission) {
            console.log('Duplicate submission detected, stopping retry attempts');
            // Set lastError to this special error and break out of the retry loop
            lastError = error;
            break;
          }
          
          lastError = error;
          attempts++;
          
          if (attempts < maxAttempts) {
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
      
      if (result) {
        toast.success('Test submitted successfully!');
        return result;
      } else {
        // Check for duplicate submission error specifically
        if (lastError && lastError.isDuplicateSubmission) {
          toast.success('This test was already submitted. Redirecting to results page...', { 
            autoClose: 3000 
          });
          
          // Return a special result to indicate this was a duplicate submission 
          // but not technically an error
          return { 
            status: 'already_submitted',
            message: 'Test was already submitted previously'
          };
        }
        
        // Provide a more informative error message based on the server response
        let errorMsg = 'Failed to submit test';
        let errorDetails = '';
        
        // Check for the specific MongoDB duplicate key error
        const errorResponse = lastError?.response?.data;
        const errorText = errorResponse?.error || '';
        
        if (errorText.includes('E11000 duplicate key error')) {
          // This is a duplicate submission - the test was already submitted
          errorMsg = 'Test already submitted';
          errorDetails = 'You have already submitted this test. Please go to your results page to view your score.';
          
          // Navigate to results page after a short delay
          setTimeout(() => {
            // Use window.location to ensure a full page reload
            window.location.href = `/test-results/${currentTestId}/${user.firebaseId || user.uid}`;
          }, 3000);
          
          toast.success('Redirecting to your test results...', { autoClose: 3000 });
          return null;
        } else if (lastError?.response?.status === 500) {
          errorMsg = 'Server error while submitting test';
          errorDetails = 'The server encountered an internal error. Your answers have been saved and you can try submitting again.';
        } else if (lastError?.response?.status === 403) {
          errorMsg = 'Not authorized to submit this test';
          errorDetails = lastError.response?.data?.message || 'You may need to purchase this test or log in again.';
        } else if (lastError?.response?.status === 404) {
          errorMsg = 'Test not found';
          errorDetails = 'The test you are trying to submit could not be found on the server.';
        } else if (lastError?.message) {
          errorDetails = lastError.message;
        }
        
        // Show a toast with the error message
        toast.error(`${errorMsg}: ${errorDetails}`);
        
        return null;
      }
    } catch (error) {
      toast.error('Error submitting test: ' + (error.message || 'Unknown error'));
      console.error('Submit error:', error);
      return null;
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
    toggleSidebar
  };

  return (
    <TestAttemptContext.Provider value={value}>
      {children}
    </TestAttemptContext.Provider>
  );
}; 