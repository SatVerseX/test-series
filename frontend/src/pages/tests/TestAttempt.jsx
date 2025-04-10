import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  TextField,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
} from '@mui/material';
import { AccessTime as AccessTimeIcon } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

const TestAttempt = () => {
  const { testId } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    if (!token) {
      console.log('No token available, redirecting to login');
      toast.error('Please login to access this test');
      navigate('/login');
      return;
    }

    const fetchTest = async () => {
      try {
        console.log('Fetching test with token:', token.substring(0, 10) + '...');
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/tests/${testId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        if (response.data) {
          console.log('Test data received:', response.data);
          console.log('Questions:', response.data.questions);
          console.log('First question:', response.data.questions[0]);
          console.log('First question options:', response.data.questions[0]?.options);
          setTest(response.data);
          setTimeLeft(response.data.duration * 60);
        } else {
          toast.error('Test not found');
          navigate('/tests');
        }
      } catch (error) {
        console.error('Error fetching test:', error);
        if (error.response?.status === 401) {
          toast.error('Please login to access this test');
          navigate('/login');
        } else if (error.response?.status === 403) {
          toast.error('You do not have permission to access this test');
          navigate('/tests');
        } else {
          toast.error('Failed to load test');
          navigate('/tests');
        }
      }
    };
    fetchTest();
  }, [testId, navigate, token]);

  useEffect(() => {
    if (!timeLeft) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  useEffect(() => {
    const autoSave = setInterval(() => {
      if (Object.keys(answers).length > 0) {
        saveAnswers();
      }
    }, 30000);
    return () => clearInterval(autoSave);
  }, [answers]);

  const saveAnswers = async () => {
    if (!token) {
      console.log('No token available for saving answers');
      return;
    }

    try {
      console.log('Saving answers with token:', token.substring(0, 10) + '...');
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/tests/${testId}/save-progress`,
        {
          userId: user.firebaseId,
          answers,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    if (isSubmitting || !token) return;
    setIsSubmitting(true);
    try {
      console.log('Submitting test with token:', token.substring(0, 10) + '...');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/tests/${testId}/attempt`,
        {
          userId: user.firebaseId,
          answers,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      toast.success('Test submitted successfully!');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (error) {
      console.error('Error submitting test:', error);
      toast.error('Failed to submit test');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!test) {
    return (
      <Container sx={{ textAlign: 'center', mt: 4 }}>
        <CircularProgress />
        <Typography>Loading test...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4">{test.title}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTimeIcon />
            <Typography variant="h6">{formatTime(timeLeft)}</Typography>
          </Box>
        </Box>
      </Paper>

      {test.sections && test.sections.map((section, sectionIndex) => {
        console.log('Rendering section:', section);
        const sectionQuestions = test.questions.filter(q => q.sectionTitle === section.title);
        console.log('Section questions:', sectionQuestions);
        
        return (
          <Paper key={section._id || sectionIndex} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              Section {sectionIndex + 1}: {section.title}
            </Typography>
            {section.description && (
              <Typography variant="body1" color="text.secondary" paragraph>
                {section.description}
              </Typography>
            )}
            
            {sectionQuestions.map((question, questionIndex) => {
              console.log('Rendering question:', question);
              
              // Create options based on correctAnswer
              const options = question.options || [
                { text: 'a', isCorrect: question.correctAnswer === 'a' },
                { text: 'b', isCorrect: question.correctAnswer === 'b' },
                { text: 'c', isCorrect: question.correctAnswer === 'c' },
                { text: 'd', isCorrect: question.correctAnswer === 'd' }
              ];
              
              console.log('Question options:', options);
              
              return (
                <Box key={question._id} sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    Question {questionIndex + 1}
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {question.text}
                  </Typography>
                  <FormControl component="fieldset">
                    <RadioGroup 
                      value={answers[question._id] || ''} 
                      onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                    >
                      {options.map((option, optionIndex) => {
                        console.log('Rendering option:', option);
                        return (
                          <FormControlLabel 
                            key={optionIndex}
                            value={option.text}
                            control={<Radio />}
                            label={option.text.toUpperCase()}
                          />
                        );
                      })}
                    </RadioGroup>
                  </FormControl>
                </Box>
              );
            })}
          </Paper>
        );
      })}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button variant="outlined" onClick={() => setShowExitDialog(true)}>Exit Test</Button>
        <Button variant="contained" color="primary" onClick={() => setShowSubmitDialog(true)}>Submit Test</Button>
      </Box>

      {/* Exit Test Dialog */}
      <Dialog
        open={showExitDialog}
        onClose={() => setShowExitDialog(false)}
      >
        <DialogTitle>Exit Test</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to exit the test? Your progress will be saved.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowExitDialog(false)}>Cancel</Button>
          <Button 
            onClick={() => {
              saveAnswers();
              navigate('/tests');
            }}
            color="primary"
          >
            Exit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Submit Test Dialog */}
      <Dialog
        open={showSubmitDialog}
        onClose={() => setShowSubmitDialog(false)}
      >
        <DialogTitle>Submit Test</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to submit the test? You won't be able to make changes after submission.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSubmitDialog(false)}>Cancel</Button>
          <Button 
            onClick={() => {
              setShowSubmitDialog(false);
              handleSubmit();
            }}
            color="primary"
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TestAttempt;