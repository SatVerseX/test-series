import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
} from '@mui/material';
import {
  AccessTime as AccessTimeIcon,
  EmojiEvents as EmojiEventsIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { auth } from '../../config/firebase';

const TestList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [filteredTests, setFilteredTests] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTest, setSelectedTest] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          throw new Error('No authenticated user');
        }

        const token = await currentUser.getIdToken();
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/tests`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setTests(response.data);
        setFilteredTests(response.data);

        // Extract unique subjects and grades
        const uniqueSubjects = [...new Set(response.data.map((test) => test.subject))];
        const uniqueGrades = [...new Set(response.data.map((test) => test.grade))];
        setSubjects(uniqueSubjects);
        setGrades(uniqueGrades);
      } catch (error) {
        console.error('Error fetching tests:', error);
        toast.error('Failed to load tests');
      }
    };

    fetchTests();
  }, []);

  useEffect(() => {
    let filtered = [...tests];

    if (selectedSubject) {
      filtered = filtered.filter((test) => test.subject === selectedSubject);
    }

    if (selectedGrade) {
      filtered = filtered.filter((test) => test.grade === selectedGrade);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (test) =>
          test.title.toLowerCase().includes(term) ||
          test.description.toLowerCase().includes(term)
      );
    }

    setFilteredTests(filtered);
  }, [selectedSubject, selectedGrade, searchTerm, tests]);

  const handleTestClick = (test) => {
    setSelectedTest(test);
    setOpenDialog(true);
  };

  const handleStartTest = () => {
    if (selectedTest) {
      navigate(`/tests/${selectedTest._id}`);
    }
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Available Tests
      </Typography>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search Tests"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Subject</InputLabel>
              <Select
                value={selectedSubject}
                label="Subject"
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                <MenuItem value="">All Subjects</MenuItem>
                {subjects.map((subject) => (
                  <MenuItem key={subject} value={subject}>
                    {subject}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Grade</InputLabel>
              <Select
                value={selectedGrade}
                label="Grade"
                onChange={(e) => setSelectedGrade(e.target.value)}
              >
                <MenuItem value="">All Grades</MenuItem>
                {grades.map((grade) => (
                  <MenuItem key={grade} value={grade}>
                    {grade}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Test List */}
      <Grid container spacing={3}>
        {filteredTests.map((test) => (
          <Grid item xs={12} md={6} lg={4} key={test._id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
              }}
              onClick={() => handleTestClick(test)}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {test.title}
                </Typography>
                <Typography color="text.secondary" gutterBottom>
                  {test.description}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Chip
                    label={test.subject}
                    color="primary"
                    size="small"
                  />
                  <Chip
                    label={test.grade}
                    color="secondary"
                    size="small"
                  />
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 1,
                  }}
                >
                  <AccessTimeIcon fontSize="small" />
                  <Typography variant="body2">
                    Duration: {formatDuration(test.duration)}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <EmojiEventsIcon fontSize="small" />
                  <Typography variant="body2">
                    Total Marks: {test.totalMarks}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Test Details Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>{selectedTest?.title}</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            {selectedTest?.description}
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>Subject:</strong> {selectedTest?.subject}
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>Grade:</strong> {selectedTest?.grade}
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>Duration:</strong> {selectedTest?.duration} minutes
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>Total Marks:</strong> {selectedTest?.totalMarks}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleStartTest} variant="contained" color="primary">
            Start Test
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TestList; 