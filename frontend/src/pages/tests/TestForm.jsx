import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TextField, Button, MenuItem, Switch, FormControlLabel, Box, Divider, Typography, Paper, Grid, Alert, Snackbar, FormControl, InputLabel, Select } from '@mui/material';
import QuestionForm from '../components/QuestionForm';
import QuestionList from '../components/QuestionList';
import { useExamCategory } from '../../contexts/ExamCategoryContext';
import { useAuth } from '../../contexts/AuthContext';

const TestForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { categories } = useExamCategory();
  const { api } = useAuth();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [testSeries, setTestSeries] = useState([]);
  const [loadingSeries, setLoadingSeries] = useState(false);

  // Get series ID from URL if it exists
  const queryParams = new URLSearchParams(location.search);
  const seriesFromUrl = queryParams.get('seriesId');

  const [test, setTest] = useState({
    title: '',
    description: '',
    category: '',
    subject: '',
    timeLimit: 30,
    questions: [],
    randomize: false,
    status: 'draft',
    isSeriesTest: !!seriesFromUrl,
    seriesId: seriesFromUrl || ''
  });

  // Fetch available test series
  useEffect(() => {
    const fetchTestSeries = async () => {
      try {
        setLoadingSeries(true);
        const response = await api.get('/api/test-series');
        setTestSeries(response.data || []);
      } catch (error) {
        console.error('Error fetching test series:', error);
      } finally {
        setLoadingSeries(false);
      }
    };

    fetchTestSeries();
  }, [api]);

  const addQuestion = (question) => {
    setTest((prev) => ({ ...prev, questions: [...prev.questions, question] }));
  };

  const removeQuestion = (index) => {
    setTest((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTest((prev) => ({ ...prev, [name]: value }));
  };

  const handleSeriesChange = (e) => {
    const seriesId = e.target.value;
    setTest(prev => ({
      ...prev,
      seriesId,
      isSeriesTest: !!seriesId
    }));
  };

  const handleSubmit = async () => {
    if (!test.title || !test.category) {
      setError("Title and Category are required fields");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const testData = {
        ...test,
        duration: parseInt(test.timeLimit),
        grade: "All",
        passingScore: 60,
        settings: {
          shuffleQuestions: test.randomize,
          showResults: true,
          timeLimit: true,
          allowReview: true
        }
      };

      console.log('Submitting test data:', testData);
      
      const response = await api.post('/api/tests', testData);
      
      if (response.status === 201) {
        navigate('/tests');
      }
    } catch (error) {
      console.error('Error creating test:', error);
      setError(error.response?.data?.message || 'Failed to create test');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom>Create New Test</Typography>
        <Divider sx={{ mb: 3 }} />
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField label="Title" name="title" value={test.title} onChange={handleChange} fullWidth margin="normal" required />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Description" name="description" value={test.description} onChange={handleChange} fullWidth margin="normal" multiline rows={3} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField 
              select 
              label="Exam Category" 
              name="category" 
              value={test.category} 
              onChange={handleChange} 
              fullWidth 
              margin="normal"
              required
              helperText="Select the standardized exam category"
            >
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.name}>
                  {category.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField 
              label="Subject" 
              name="subject" 
              value={test.subject} 
              onChange={handleChange} 
              fullWidth 
              margin="normal"
              helperText="Subject within the exam category (e.g., Physics, English)"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Time Limit (mins)" name="timeLimit" type="number" value={test.timeLimit} onChange={handleChange} fullWidth margin="normal" />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
              <FormControlLabel 
                control={<Switch checked={test.randomize} onChange={() => setTest((prev) => ({ ...prev, randomize: !prev.randomize }))} />} 
                label="Randomize Questions" 
              />
              <FormControlLabel 
                control={<Switch checked={test.status === 'Published'} onChange={() => setTest((prev) => ({ ...prev, status: prev.status === 'Draft' ? 'Published' : 'Draft' }))} />} 
                label="Publish" 
              />
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="test-series-label">Add to Test Series</InputLabel>
              <Select
                labelId="test-series-label"
                id="test-series-select"
                value={test.seriesId}
                label="Add to Test Series"
                onChange={handleSeriesChange}
                disabled={loadingSeries}
              >
                <MenuItem value="">None</MenuItem>
                {testSeries.map((series) => (
                  <MenuItem key={series._id} value={series._id}>
                    {series.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 4 }} />
        <Typography variant="h5" gutterBottom>Questions</Typography>
        
        <QuestionForm addQuestion={addQuestion} />
        <QuestionList questions={test.questions} removeQuestion={removeQuestion} />
        
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSubmit} 
            size="large"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Save Test'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default TestForm;
