import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, MenuItem, Switch, FormControlLabel } from '@mui/material';
import QuestionForm from '../components/QuestionForm';
import QuestionList from '../components/QuestionList';

const TestForm = () => {
  const navigate = useNavigate();
  const [test, setTest] = useState({
    title: '',
    description: '',
    category: '',
    subject: '',
    timeLimit: 30,
    questions: [],
    randomize: false,
    status: 'Draft',
  });

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

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(test),
      });
      if (response.ok) navigate('/tests');
    } catch (error) {
      console.error('Error creating test:', error);
    }
  };

  return (
    <div>
      <h2>Create/Edit Test</h2>
      <TextField label="Title" name="title" value={test.title} onChange={handleChange} fullWidth margin="normal" />
      <TextField label="Description" name="description" value={test.description} onChange={handleChange} fullWidth margin="normal" multiline rows={3} />
      <TextField select label="Category" name="category" value={test.category} onChange={handleChange} fullWidth margin="normal">
        <MenuItem value="Math">Math</MenuItem>
        <MenuItem value="Science">Science</MenuItem>
      </TextField>
      <TextField label="Subject" name="subject" value={test.subject} onChange={handleChange} fullWidth margin="normal" />
      <TextField label="Time Limit (mins)" name="timeLimit" type="number" value={test.timeLimit} onChange={handleChange} fullWidth margin="normal" />
      
      <FormControlLabel control={<Switch checked={test.randomize} onChange={() => setTest((prev) => ({ ...prev, randomize: !prev.randomize }))} />} label="Randomize Questions" />
      <FormControlLabel control={<Switch checked={test.status === 'Published'} onChange={() => setTest((prev) => ({ ...prev, status: prev.status === 'Draft' ? 'Published' : 'Draft' }))} />} label="Publish" />
      
      <QuestionForm addQuestion={addQuestion} />
      <QuestionList questions={test.questions} removeQuestion={removeQuestion} />
      
      <Button variant="contained" color="primary" onClick={handleSubmit}>Save Test</Button>
    </div>
  );
};

export default TestForm;
