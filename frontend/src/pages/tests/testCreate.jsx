import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Chip
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import QuestionForm from './QuestionForm';
import QuestionList from './QuestionList';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../config/firebase';

const TestCreationPage = () => {
  const navigate = useNavigate();
  const { api } = useAuth();
  const [testData, setTestData] = useState({
    title: '',
    description: '',
    grade: '',
    subject: '',
    duration: 60,
    passingScore: 40,
    sections: [],
    questions: []
  });
  const [currentSection, setCurrentSection] = useState(null);
  const [showSectionDialog, setShowSectionDialog] = useState(false);
  const [sectionForm, setSectionForm] = useState({
    title: '',
    description: ''
  });
  const [editingSection, setEditingSection] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTestDataChange = (e) => {
    const { name, value } = e.target;
    setTestData(prev => ({
      ...prev,
      [name]: value
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

      if (testData.sections.length === 0) {
        throw new Error('Please add at least one section');
      }

      if (testData.questions.length === 0) {
        throw new Error('Please add at least one question');
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

      // Add sectionId to questions based on sectionTitle
      testToSave.questions = testData.questions.map(question => {
        // Find the section that matches this question's sectionTitle
        const section = testData.sections.find(s => s.title === question.sectionTitle);
        if (!section) {
          throw new Error(`Section not found for question: ${question.text}`);
        }
        
        // Return the question with the section's _id as sectionId
        return {
          ...question,
          sectionId: section._id
        };
      });

      // Debug logs
      console.log('Test data being sent:', testToSave);
      console.log('Sections:', testToSave.sections);
      console.log('Questions:', testToSave.questions);

      // Send to backend using the api instance from AuthContext with explicit token
      const response = await api.post('/api/tests', testToSave, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('Server response:', response.data);
      
      toast.success('Test created successfully!');
      navigate('/tests');
    } catch (error) {
      console.error('Error creating test:', error);
      console.error('Error details:', error.response?.data);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        toast.error('Your session has expired. Please log in again.');
        navigate('/login');
        return;
      }
      
      setError(error.response?.data?.error || error.message || 'Error creating test');
      toast.error(error.response?.data?.error || error.message || 'Error creating test');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Create New Test
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Test Title"
              name="title"
              value={testData.title}
              onChange={handleTestDataChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Grade"
              name="grade"
              value={testData.grade}
              onChange={handleTestDataChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Subject"
              name="subject"
              value={testData.subject}
              onChange={handleTestDataChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Duration (minutes)"
              name="duration"
              type="number"
              value={testData.duration}
              onChange={handleTestDataChange}
              required
              inputProps={{ min: 1 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Passing Score (%)"
              name="passingScore"
              type="number"
              value={testData.passingScore}
              onChange={handleTestDataChange}
              required
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
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Sections</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowSectionDialog(true)}
          >
            Add Section
          </Button>
        </Box>

        <List>
          {testData.sections.map((section, index) => (
            <React.Fragment key={section._id}>
              <ListItem
                selected={currentSection?._id === section._id}
                onClick={() => setCurrentSection(section)}
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1">
                        Section {index + 1}: {section.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ({section.totalQuestions} questions, {section.totalMarks} marks)
                      </Typography>
                    </Box>
                  }
                  secondary={section.description}
                />
                <ListItemSecondaryAction>
                  <IconButton edge="end" onClick={(e) => {
                    e.stopPropagation();
                    handleEditSection(section);
                  }}>
                    <EditIcon />
                  </IconButton>
                  <IconButton edge="end" onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSection(section._id);
                  }}>
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
              {index < testData.sections.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Questions</Typography>
          {currentSection ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="subtitle1" color="primary">
                Current Section: {currentSection.title}
              </Typography>
              <Chip
                label={`${testData.questions.filter(q => q.sectionTitle === currentSection.title).length} questions`}
                color="primary"
                variant="outlined"
              />
            </Box>
          ) : (
            <Typography variant="subtitle1" color="error">
              Please select a section to add questions
            </Typography>
          )}
        </Box>

        {currentSection ? (
          <>
            <QuestionForm onSubmit={handleAddQuestion} />
            <Box sx={{ mt: 3 }}>
      <QuestionList
                questions={testData.questions.filter(q => q.sectionTitle === currentSection.title)}
                onEdit={handleEditQuestion}
                onDelete={handleDeleteQuestion}
                onReorder={handleReorderQuestions}
              />
            </Box>
          </>
        ) : (
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'action.hover' }}>
            <Typography color="text.secondary">
              Select a section from the list above to start adding questions
            </Typography>
          </Paper>
        )}
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="outlined"
          onClick={() => navigate('/tests')}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Test'}
        </Button>
      </Box>

      <Dialog open={showSectionDialog} onClose={() => {
        setShowSectionDialog(false);
        setEditingSection(null);
      }}>
        <DialogTitle>
          {editingSection ? 'Edit Section' : 'Add Section'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Section Title"
            name="title"
            fullWidth
            value={sectionForm.title}
            onChange={handleSectionFormChange}
            required
          />
          <TextField
            margin="dense"
            label="Description"
            name="description"
            fullWidth
            multiline
            rows={3}
            value={sectionForm.description}
            onChange={handleSectionFormChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowSectionDialog(false);
            setEditingSection(null);
          }}>Cancel</Button>
          <Button onClick={editingSection ? handleUpdateSection : handleAddSection}>
            {editingSection ? 'Update' : 'Add'}
      </Button>
        </DialogActions>
      </Dialog>

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
