import React, { useState } from 'react';
import {
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  Divider,
  Grid,
  FormHelperText
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';

const QuestionForm = ({ onSubmit }) => {
  const [question, setQuestion] = useState({
    text: '',
    type: 'mcq',
    options: ['', ''],
    correctAnswer: '',
    explanation: '',
    marks: 1
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setQuestion(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...question.options];
    newOptions[index] = value;
    setQuestion(prev => ({
      ...prev,
      options: newOptions
    }));
  };

  const handleAddOption = () => {
    setQuestion(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const handleRemoveOption = (index) => {
    if (question.options.length <= 2) {
      toast.error('MCQ must have at least 2 options');
      return;
    }
    setQuestion(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate question
    if (!question.text) {
      toast.error('Question text is required');
      return;
    }

    if (question.type === 'mcq') {
      if (question.options.length < 2) {
        toast.error('MCQ must have at least 2 options');
        return;
      }
      if (!question.options.includes(question.correctAnswer)) {
        toast.error('Correct answer must be one of the options');
        return;
      }
    } else if (!question.correctAnswer) {
      toast.error('Correct answer is required');
      return;
    }

    onSubmit(question);

    // Reset form
    setQuestion({
      text: '',
      type: 'mcq',
      options: ['', ''],
      correctAnswer: '',
      explanation: '',
      marks: 1
    });
  };

  return (
    <Paper component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Question Text"
            name="text"
            value={question.text}
            onChange={handleChange}
            multiline
            rows={2}
            required
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Question Type</InputLabel>
            <Select
              name="type"
              value={question.type}
              onChange={handleChange}
              label="Question Type"
            >
              <MenuItem value="mcq">Multiple Choice</MenuItem>
              <MenuItem value="true_false">True/False</MenuItem>
              <MenuItem value="short_answer">Short Answer</MenuItem>
              <MenuItem value="integer">Integer</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Marks"
            name="marks"
            type="number"
            value={question.marks}
            onChange={handleChange}
            inputProps={{ min: 1 }}
            required
          />
        </Grid>

        {question.type === 'mcq' && (
          <Grid item xs={12}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Options
              </Typography>
              {question.options.map((option, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    fullWidth
                    label={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    required
                  />
                  <IconButton
                    onClick={() => handleRemoveOption(index)}
                    disabled={question.options.length <= 2}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddOption}
                sx={{ mt: 1 }}
              >
                Add Option
              </Button>
            </Box>
          </Grid>
        )}

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Correct Answer"
            name="correctAnswer"
            value={question.correctAnswer}
            onChange={handleChange}
            required
            helperText={
              question.type === 'mcq'
                ? 'Select one of the options above'
                : question.type === 'true_false'
                ? 'Enter "true" or "false"'
                : question.type === 'integer'
                ? 'Enter a whole number'
                : 'Enter the correct answer'
            }
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Explanation"
            name="explanation"
            value={question.explanation}
            onChange={handleChange}
            multiline
            rows={2}
          />
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
            >
              Add Question
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default QuestionForm;
