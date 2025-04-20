import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Box,
  Grid,
  MenuItem,
  Snackbar,
  Alert,
  IconButton,
  Divider,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  CircularProgress,
  FormControlLabel,
  Switch,
  FormControl,
  InputLabel,
  Select,
  Tooltip
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, Info as InfoIcon } from '@mui/icons-material';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { toast } from 'react-toastify';
import QuestionForm from './QuestionForm';
import QuestionList from './QuestionList';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../config/firebase';
import { useExamCategory } from '../../contexts/ExamCategoryContext';
import { alpha } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';
import AssignmentIcon from '@mui/icons-material/Assignment';

const TestCreationPage = () => {
  const navigate = useNavigate();
  const { testId } = useParams();
  const { api, user } = useAuth();
  const { categories } = useExamCategory();
  const [testData, setTestData] = useState({
    title: '',
    description: '',
    grade: '',
    subject: '',
    category: '',
    duration: 60,
    passingScore: 40,
    sections: [],
    questions: [],
    // New fields for paid/free tests
    isPaid: false,
    price: 0,
    discount: 0,
    accessDuration: 'Unlimited',
    isSeriesTest: false,
    seriesId: ''
  });
  const [currentSection, setCurrentSection] = useState(null);
  const [showSectionDialog, setShowSectionDialog] = useState(false);
  const [sectionForm, setSectionForm] = useState({
    title: '',
    description: ''
  });
  const [editingSection, setEditingSection] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!testId);
  const [error, setError] = useState('');
  const [isEditMode, setIsEditMode] = useState(!!testId);
  const [testSeries, setTestSeries] = useState([]);
  const [loadingSeries, setLoadingSeries] = useState(false);
  const theme = useTheme();

  // Duration options
  const durationOptions = [
    { value: 'Unlimited', label: 'Unlimited' },
    { value: '7 days', label: '7 days' },
    { value: '30 days', label: '30 days' },
    { value: '90 days', label: '3 months' },
    { value: '180 days', label: '6 months' },
    { value: '365 days', label: '1 year' }
  ];

  // Fetch existing test data if in edit mode
  useEffect(() => {
    const fetchTest = async () => {
      if (!testId) return;
      
      try {
        setInitialLoading(true);
        const response = await api.get(`/api/tests/${testId}`);
        
        if (response.data) {
          setTestData(response.data);
          // If there are sections, select the first one by default
          if (response.data.sections && response.data.sections.length > 0) {
            setCurrentSection(response.data.sections[0]);
          }
          toast.success('Test loaded successfully');
        }
      } catch (error) {
        console.error('Error fetching test:', error);
        toast.error('Error loading test: ' + (error.response?.data?.message || error.message));
        navigate('/tests');
      } finally {
        setInitialLoading(false);
      }
    };

    if (testId) {
      fetchTest();
    }
  }, [testId, api, navigate]);

  // Fetch available test series for selection
  useEffect(() => {
    const fetchTestSeries = async () => {
      if (!user || !(user.role === 'admin' || user.role === 'teacher')) return;
      
      try {
        setLoadingSeries(true);
        const response = await api.get('/api/test-series');
        if (response.data) {
          setTestSeries(response.data);
        }
      } catch (error) {
        console.error('Error fetching test series:', error);
      } finally {
        setLoadingSeries(false);
      }
    };

    fetchTestSeries();
  }, [api, user]);

  const handleTestDataChange = (e) => {
    const { name, value } = e.target;
    setTestData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleIsPaidChange = (e) => {
    const isPaid = e.target.checked;
    setTestData(prev => ({
      ...prev,
      isPaid,
      // Reset price and discount to 0 if switching to free
      price: isPaid ? prev.price : 0,
      discount: isPaid ? prev.discount : 0
    }));
  };

  const handleIsSeriesTestChange = (e) => {
    const isSeriesTest = e.target.checked;
    setTestData(prev => ({
      ...prev,
      isSeriesTest,
      // Reset seriesId if switching off
      seriesId: isSeriesTest ? prev.seriesId : ''
    }));
  };

  const handleSectionFormChange = (e) => {
    const { name, value } = e.target;
    setSectionForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddSection = () => {
    if (!sectionForm.title) {
      toast.error('Section title is required');
      return;
    }

    const newSection = {
      _id: Date.now().toString(), // Temporary ID for frontend
      title: sectionForm.title,
      description: sectionForm.description,
      order: testData.sections.length,
      totalMarks: 0,
      totalQuestions: 0,
      passingMarks: 0
    };

    setTestData(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));

    // Automatically select the newly created section
    setCurrentSection(newSection);

    setSectionForm({ title: '', description: '' });
    setShowSectionDialog(false);
  };

  const handleEditSection = (section) => {
    // Set the editing section
    setEditingSection(section);
    setSectionForm({
      title: section.title,
      description: section.description
    });
    setShowSectionDialog(true);
  };

  const handleUpdateSection = () => {
    if (!sectionForm.title) {
      toast.error('Section title is required');
      return;
    }

    setTestData(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section._id === editingSection._id
          ? { ...section, title: sectionForm.title, description: sectionForm.description }
          : section
      )
    }));

    // Update currentSection if it was the one being edited
    if (currentSection && currentSection._id === editingSection._id) {
      setCurrentSection({
        ...currentSection,
        title: sectionForm.title,
        description: sectionForm.description
      });
    }

    setSectionForm({ title: '', description: '' });
    setEditingSection(null);
    setShowSectionDialog(false);
  };

  const handleDeleteSection = (sectionId) => {
    // Check if section has questions
    const sectionQuestions = testData.questions.filter(q => q.sectionId === sectionId);
    if (sectionQuestions.length > 0) {
      toast.error('Cannot delete section with questions. Please remove questions first.');
      return;
    }

    setTestData(prev => ({
      ...prev,
      sections: prev.sections.filter(section => section._id !== sectionId)
    }));

    // If the deleted section was the current section, clear the selection
    if (currentSection && currentSection._id === sectionId) {
      setCurrentSection(null);
    }
  };

  const handleAddQuestion = (questionData) => {
    if (!currentSection) {
      toast.error('Please select a section first');
      return;
    }

    // Add section title to the question
    const questionWithSection = {
      ...questionData,
      sectionTitle: currentSection.title
    };

    setTestData(prev => ({
      ...prev,
      questions: [...prev.questions, questionWithSection]
    }));
  };

  const handleEditQuestion = (index) => {
    const question = testData.questions[index];
    setCurrentSection(testData.sections.find(s => s._id === question.sectionId));
    // Handle question editing logic
  };

  const handleDeleteQuestion = (index) => {
    setTestData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const handleReorderQuestions = (sourceIndex, destinationIndex) => {
    const newQuestions = [...testData.questions];
    const [removed] = newQuestions.splice(sourceIndex, 1);
    newQuestions.splice(destinationIndex, 0, removed);
    setTestData(prev => ({
      ...prev,
      questions: newQuestions
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');

      // Validate test data
      if (!testData.title || !testData.grade || !testData.subject) {
        throw new Error('Please fill in all required fields');
      }

      // Validate category
      if (!testData.category) {
        throw new Error('Please select a category for the test');
      }

      if (testData.sections.length === 0) {
        throw new Error('Please add at least one section');
      }

      if (testData.questions.length === 0) {
        throw new Error('Please add at least one question');
      }

      // Validate series test
      if (testData.isSeriesTest && !testData.seriesId) {
        throw new Error('Please select a test series');
      }

      // Ensure user is authenticated and token is valid
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast.error('You must be logged in to create a test');
        navigate('/login');
        return;
      }

      // Force token refresh before making the API call
      let token;
      try {
        token = await currentUser.getIdToken(true);
        console.log('Token refreshed successfully, length:', token ? token.length : 0);
      } catch (tokenError) {
        console.error('Error refreshing token:', tokenError);
        toast.error('Authentication error. Please log in again.');
        navigate('/login');
        return;
      }

      // Prepare test data for submission
      const testToSave = {
        ...testData,
        // Remove _id from sections as MongoDB will generate these
        sections: testData.sections.map((section, index) => {
          const { _id, ...sectionWithoutId } = section;
          return {
            ...sectionWithoutId,
            order: index
          };
        })
      };

      let response;
      
      if (isEditMode) {
        // Update existing test
        response = await api.put(`/api/tests/${testId}`, testToSave);
        toast.success('Test updated successfully');
      } else {
        // Create new test
        response = await api.post('/api/tests', testToSave);
        toast.success('Test created successfully');
      }

      navigate('/tests');
    } catch (error) {
      console.error('Error saving test:', error);
      console.log('Error response:', error.response?.data);
      toast.error('Error saving test: ' + (error.response?.data?.message || error.message));
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        {initialLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress />
            <Typography variant="h6" sx={{ ml: 2 }}>
              Loading test data...
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h5" gutterBottom>
                {isEditMode ? 'Edit Test' : 'Create New Test'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Design your test with sections and questions, set pricing options, and optionally add it to a test series for structured learning paths.
              </Typography>
              <Divider sx={{ mb: 3 }} />
            </Grid>

            {/* Test Basic Information */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Test Title"
                name="title"
                value={testData.title}
                onChange={handleTestDataChange}
                required
                margin="normal"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Subject"
                name="subject"
                value={testData.subject}
                onChange={handleTestDataChange}
                required
                margin="normal"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Grade Level"
                name="grade"
                value={testData.grade}
                onChange={handleTestDataChange}
                required
                margin="normal"
                select
              >
                <MenuItem value="10th">10th</MenuItem>
                <MenuItem value="11th">11th</MenuItem>
                <MenuItem value="12th">12th</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Duration (minutes)"
                name="duration"
                type="number"
                value={testData.duration}
                onChange={handleTestDataChange}
                required
                margin="normal"
                inputProps={{ min: 1 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Passing Score (%)"
                name="passingScore"
                type="number"
                value={testData.passingScore}
                onChange={handleTestDataChange}
                required
                margin="normal"
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={testData.description}
                onChange={handleTestDataChange}
                multiline
                rows={3}
                margin="normal"
              />
            </Grid>

            {/* Access and Pricing Section */}
            <Grid item xs={12}>
              <Box sx={{ mt: 3, mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Access and Pricing
                </Typography>
                <Divider />
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Category</InputLabel>
                <Select
                  value={testData.category}
                  name="category"
                  onChange={handleTestDataChange}
                  label="Category"
                >
                  <MenuItem value="">
                    <em>Select a category</em>
                  </MenuItem>
                  {categories.map(category => (
                    <MenuItem key={category.id} value={category.name}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
                <Typography variant="caption" color="text.secondary">
                  Categorize your test for better discoverability
                </Typography>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', mt: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={testData.isSeriesTest}
                      onChange={handleIsSeriesTestChange}
                      name="isSeriesTest"
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography>Add to Test Series</Typography>
                      <Tooltip title="Include this test in a test series collection">
                        <IconButton size="small">
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                />
                
                {!testData.isSeriesTest && (
                  <Box sx={{ mt: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      color="primary"
                      onClick={() => navigate('/test-series/create')}
                      startIcon={<AddIcon />}
                    >
                      Create New Series
                    </Button>
                  </Box>
                )}
              </Box>
            </Grid>

            {testData.isSeriesTest && (
              <>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Test Series</InputLabel>
                    <Select
                      value={testData.seriesId}
                      name="seriesId"
                      onChange={handleTestDataChange}
                      label="Test Series"
                      disabled={loadingSeries}
                    >
                      <MenuItem value="">
                        <em>Select a test series</em>
                      </MenuItem>
                      {testSeries.map(series => (
                        <MenuItem key={series._id} value={series._id}>
                          {series.title} {series.subject ? `(${series.subject})` : ''}
                        </MenuItem>
                      ))}
                    </Select>
                    {testData.seriesId && (
                      <Box sx={{ mt: 1 }}>
                        <Chip 
                          label={testSeries.find(s => s._id === testData.seriesId)?.title || 'Selected Series'} 
                          color="primary" 
                          variant="outlined"
                          size="small"
                        />
                      </Box>
                    )}
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', mt: 3 }}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        color="primary"
                        onClick={() => navigate('/test-series/create')}
                        startIcon={<AddIcon />}
                      >
                        Create New Series
                      </Button>
                      
                      {testData.seriesId && (
                        <Button
                          variant="outlined"
                          size="small"
                          color="secondary"
                          onClick={() => navigate(`/test-series/edit/${testData.seriesId}`)}
                          startIcon={<EditIcon />}
                        >
                          Edit Series
                        </Button>
                      )}
                    </Box>
                    
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                      Adding to a series allows students to progress through a structured learning path
                    </Typography>
                  </Box>
                </Grid>
              </>
            )}

            {/* Sections Section */}
            <Grid item xs={12}>
              <Box sx={{ mt: 3, mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Sections
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Organize your questions into sections for better structure
                  </Typography>
                  <Button
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setEditingSection(null);
                      setSectionForm({ title: '', description: '' });
                      setShowSectionDialog(true);
                    }}
                    variant="outlined"
                  >
                    Add Section
                  </Button>
                </Box>
              </Box>
              
              {/* Series info banner */}
              {testData.isSeriesTest && testData.seriesId && (
                <Paper 
                  sx={{ 
                    p: 2, 
                    mb: 3, 
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    flexWrap: 'wrap'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                    <AssignmentIcon color="primary" sx={{ mr: 1 }} />
                    <Box>
                      <Typography variant="subtitle1" fontWeight="medium">
                        Part of Test Series: {testSeries.find(s => s._id === testData.seriesId)?.title || 'Selected Series'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        This test will appear in the series collection for students
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Button 
                    variant="outlined" 
                    size="small" 
                    color="primary"
                    onClick={() => navigate(`/test-series/edit/${testData.seriesId}`)}
                  >
                    View Series
                  </Button>
                </Paper>
              )}

              {testData.sections.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'background.default' }}>
                  <Typography color="text.secondary">
                    No sections added yet. Add a section to organize your questions.
                  </Typography>
                </Paper>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  {testData.sections.map((section) => (
                    <Card
                      key={section._id}
                      sx={{
                        width: 220,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        bgcolor: currentSection?._id === section._id ? 'primary.main' : 'background.paper',
                        color: currentSection?._id === section._id ? 'white' : 'text.primary',
                        '&:hover': {
                          boxShadow: 3,
                          transform: 'translateY(-3px)'
                        }
                      }}
                      onClick={() => setCurrentSection(section)}
                    >
                      <CardContent>
                        <Typography variant="h6" noWrap>
                          {section.title}
                        </Typography>
                        <Typography variant="body2" color={currentSection?._id === section._id ? 'white' : 'text.secondary'} noWrap>
                          {section.description || 'No description'}
                        </Typography>
                      </CardContent>
                      <CardActions
                        sx={{
                          justifyContent: 'space-between',
                          bgcolor: currentSection?._id === section._id ? 'primary.dark' : 'background.default'
                        }}
                      >
                        <IconButton size="small" onClick={(e) => {
                          e.stopPropagation();
                          handleEditSection(section);
                        }}>
                          <EditIcon fontSize="small" color={currentSection?._id === section._id ? 'white' : 'primary'} />
                        </IconButton>
                        <IconButton size="small" onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSection(section._id);
                        }}>
                          <DeleteIcon fontSize="small" color={currentSection?._id === section._id ? 'white' : 'error'} />
                        </IconButton>
                      </CardActions>
                    </Card>
                  ))}
                </Box>
              )}
            </Grid>

            {/* Questions Section */}
            {currentSection && (
              <>
                <Grid item xs={12}>
                  <Box sx={{ mt: 4, mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Questions for {currentSection.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Add questions to this section
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <QuestionForm onSubmit={handleAddQuestion} />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ mt: 3, mb: 1 }}>
                    <Typography variant="subtitle1">
                      {testData.questions.length} Question(s) Added
                    </Typography>
                  </Box>
                  <QuestionList
                    questions={testData.questions.filter(q => q.sectionTitle === currentSection.title)}
                    onEdit={handleEditQuestion}
                    onDelete={handleDeleteQuestion}
                    onReorder={handleReorderQuestions}
                  />
                </Grid>
              </>
            )}

            {/* Submit Button */}
            <Grid item xs={12}>
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/tests')}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={loading}
                  startIcon={loading && <CircularProgress size={20} color="inherit" />}
                >
                  {isEditMode ? 'Update Test' : 'Create Test'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        )}

        {/* Section Dialog */}
        <Dialog open={showSectionDialog} onClose={() => setShowSectionDialog(false)}>
          <DialogTitle>{editingSection ? 'Edit Section' : 'Add New Section'}</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              name="title"
              label="Section Title"
              fullWidth
              value={sectionForm.title}
              onChange={handleSectionFormChange}
              required
            />
            <TextField
              margin="dense"
              name="description"
              label="Section Description"
              fullWidth
              multiline
              rows={3}
              value={sectionForm.description}
              onChange={handleSectionFormChange}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowSectionDialog(false)}>Cancel</Button>
            <Button onClick={editingSection ? handleUpdateSection : handleAddSection}>
              {editingSection ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
      >
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default TestCreationPage;
