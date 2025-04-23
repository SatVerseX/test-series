import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Breadcrumbs,
  Link,
  Button,
  Divider,
  Grid,
  Avatar,
  Chip,
  CircularProgress,
  Card,
  CardContent,
  alpha,
  useTheme,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BarChartIcon from '@mui/icons-material/BarChart';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useAuth } from '../../contexts/AuthContext';
import TestLeaderboard from '../../components/leaderboard/TestLeaderboard';
import { toast } from 'react-hot-toast';
import { Link as RouterLink } from 'react-router-dom';

const TestLeaderboardPage = () => {
  const { seriesId, testId } = useParams();
  const { user, api } = useAuth();
  const [testData, setTestData] = useState(null);
  const [seriesData, setSeriesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userTestAttempt, setUserTestAttempt] = useState(null);
  const [showSelector, setShowSelector] = useState(!testId);
  const [availableTests, setAvailableTests] = useState([]);
  const [selectedTestId, setSelectedTestId] = useState(testId || '');
  const [selectedTest, setSelectedTest] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAvailableTests = async () => {
      try {
        if (!testId && user) {
          setLoading(true);
          // Fetch the user's stats which includes test attempts
          // Don't use cache busting for stats endpoint to avoid CORS issues
          const response = await api.get(`/api/users/${user.firebaseId}/stats`);
          
          if (response.data && Array.isArray(response.data.recentTests)) {
            // Get unique tests from attempts
            const uniqueTests = [];
            const testIds = new Set();
            
            response.data.recentTests.forEach(test => {
              if (!testIds.has(test.testId) && test.status === 'completed') {
                testIds.add(test.testId);
                uniqueTests.push({
                  id: test.testId,
                  title: test.title || `Test ${test.testId}`,
                  date: new Date(test.completedAt).toLocaleDateString()
                });
              }
            });
            
            setAvailableTests(uniqueTests);
            setShowSelector(true);
          }
        }
      } catch (err) {
        console.error('Error fetching available tests:', err);
        setError('Failed to load your completed tests. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableTests();
  }, [user, testId, api]);

  useEffect(() => {
    // Reset when testId changes
    if (testId) {
      setSelectedTestId(testId);
      setShowSelector(false);
    }
  }, [testId]);

  useEffect(() => {
    const fetchTestDetails = async () => {
      // Only fetch if we have a test ID (either from URL or selected)
      const currentTestId = testId || selectedTestId;
      if (!currentTestId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch test details
        const testResponse = await api.get(`/api/tests/${currentTestId}`);
        if (testResponse.data) {
          setTestData(testResponse.data);
          setSelectedTest(testResponse.data);
        }

        // If we have a seriesId, fetch series details
        if (seriesId) {
          const seriesResponse = await api.get(`/api/test-series/${seriesId}`);
          if (seriesResponse.data) {
            setSeriesData(seriesResponse.data);
          }
        }

        // Fetch user's attempt for this test if logged in
        if (user) {
          try {
            const userAttemptResponse = await api.get(`/api/tests/${currentTestId}/user-attempt`);
            if (userAttemptResponse.data) {
              setUserTestAttempt(userAttemptResponse.data);
            }
          } catch (attemptErr) {
            // It's okay if the user hasn't attempted this test yet
            console.log('User has not attempted this test yet');
          }
        }
      } catch (err) {
        console.error('Error fetching test details:', err);
        setError(err.response?.data?.error || 'Failed to load test details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTestDetails();
  }, [testId, seriesId, user, api, selectedTestId]);

  const handleTestSelect = (event) => {
    const newTestId = event.target.value;
    setSelectedTestId(newTestId);
    
    // Update URL to include the selected test
    if (newTestId) {
      navigate(`/test-leaderboard/${newTestId}`);
    }
  };

  // Format time in a readable way (same as in TestLeaderboard)
  const formatTime = (seconds) => {
    if (!seconds) return 'N/A';
    
    // Handle large time values by showing hours if needed
    if (seconds >= 3600) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const remainingSeconds = seconds % 60;
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    // If only seconds, just show seconds
    if (minutes === 0) {
      return `${remainingSeconds}s`;
    }
    
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!testId && !selectedTestId && showSelector) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          Test Leaderboard
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {availableTests.length > 0 ? (
          <Box sx={{ maxWidth: 600, mx: 'auto', my: 4 }}>
            <Typography variant="h6" gutterBottom>
              Select a completed test to view its leaderboard
            </Typography>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="test-selector-label">Select Test</InputLabel>
              <Select
                labelId="test-selector-label"
                value={selectedTestId}
                onChange={handleTestSelect}
                label="Select Test"
              >
                <MenuItem value="" disabled>
                  <em>Select a test</em>
                </MenuItem>
                {availableTests.map(test => (
                  <MenuItem key={test.id} value={test.id}>
                    {test.title} (completed on {test.date})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Only tests you have completed will appear in this list. Complete more tests to view their leaderboards.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" gutterBottom>
              No completed tests found
            </Typography>
            <Typography variant="body1" paragraph>
              You need to complete at least one test before you can view leaderboards.
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              component={Link} 
              to="/tests"
              startIcon={<PlayArrowIcon />}
            >
              Take a Test Now
            </Button>
          </Box>
        )}
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button variant="outlined" component={Link} to="/tests">
            Return to Tests
          </Button>
        </Box>
      </Container>
    );
  }

  // Determine which test ID to use - either from URL or selected
  const effectiveTestId = testId || selectedTestId;
  const effectiveTestTitle = testData?.title || selectedTest?.title || 'Test Leaderboard';

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumb navigation */}
      <Breadcrumbs separator="›" aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Link underline="hover" color="inherit" component={RouterLink} to="/dashboard">
          Dashboard
        </Link>
        <Link underline="hover" color="inherit" component={RouterLink} to="/tests">
          Tests
        </Link>
        {seriesData && (
          <Link
            underline="hover"
            color="inherit"
            component={RouterLink}
            to={`/test-series/${seriesId}`}
          >
            {seriesData.title}
          </Link>
        )}
        <Typography color="text.primary">{effectiveTestTitle}</Typography>
      </Breadcrumbs>

      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {effectiveTestTitle} - Leaderboard
        </Typography>
        
        {userTestAttempt && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
              Your Performance
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Paper elevation={1} sx={{ p: 2, bgcolor: 'background.paper', textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Your Score</Typography>
                  <Typography variant="h4" color="primary.main">
                    {userTestAttempt.score || 0}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper elevation={1} sx={{ p: 2, bgcolor: 'background.paper', textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Accuracy</Typography>
                  <Typography variant="h4" color="success.main">
                    {userTestAttempt.accuracy ? `${userTestAttempt.accuracy}%` : 'N/A'}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper elevation={1} sx={{ p: 2, bgcolor: 'background.paper', textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Time Taken</Typography>
                  <Typography variant="h4" color="info.main">
                    {formatTime(userTestAttempt.timeTaken)}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}

        <TestLeaderboard 
          testId={effectiveTestId} 
          testTitle={effectiveTestTitle}
        />
      </Paper>
    </Container>
  );
};

export default TestLeaderboardPage; 