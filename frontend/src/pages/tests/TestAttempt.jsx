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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    const fetchTest = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/tests/${testId}`);
        setTest(response.data);
        setTimeLeft(response.data.duration * 60); 
      } catch (error) {
        console.error('Error fetching test:', error);
        toast.error('Failed to load test');
        navigate('/tests');
      }
    };
    fetchTest();
  }, [testId, navigate]);

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
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/tests/${testId}/save-progress`, {
        userId: user.firebaseUid,
        answers,
      });
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/tests/${testId}/submit`, {
        userId: user.firebaseUid,
        answers,
      });
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

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6">Question {activeStep + 1}</Typography>
        <Typography variant="body1" paragraph>{test.questions[activeStep].questionText}</Typography>
        <FormControl component="fieldset">
          <RadioGroup value={answers[test.questions[activeStep]._id] || ''} onChange={(e) => handleAnswerChange(test.questions[activeStep]._id, e.target.value)}>
            {test.questions[activeStep].options.map((option, index) => (
              <FormControlLabel key={index} value={option.text} control={<Radio />} label={option.text} />
            ))}
          </RadioGroup>
        </FormControl>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button variant="outlined" onClick={() => setShowExitDialog(true)}>Exit Test</Button>
        <Button variant="contained" color="primary" onClick={() => setShowSubmitDialog(true)}>Submit Test</Button>
      </Box>
    </Container>
  );
};

export default TestAttempt;