import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Breadcrumbs, 
  Link, 
  CircularProgress, 
  Button, 
  useTheme, 
  alpha,
  Paper,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import TestSeriesLeaderboard from '../../components/leaderboard/TestSeriesLeaderboard';
import api from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import HomeIcon from '@mui/icons-material/Home';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const TestSeriesLeaderboardPage = () => {
  const { seriesId } = useParams();
  const { user } = useAuth();
  const theme = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [seriesData, setSeriesData] = useState(null);
  const [activeTab, setActiveTab] = useState('overall'); // 'overall' or 'tests'
  const [selectedTest, setSelectedTest] = useState(null);

  useEffect(() => {
    const fetchSeriesData = async () => {
      try {
        if (!seriesId) {
          setError('Series ID is required');
          setLoading(false);
          return;
        }

        const response = await api.get(`/api/test-series/${seriesId}`);
        
        if (response.data) {
          setSeriesData(response.data);
          // If there are tests, set the first one as selected
          if (response.data.tests && response.data.tests.length > 0) {
            setSelectedTest(response.data.tests[0]._id);
          }
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error('Error fetching series data:', err);
        if (err.response?.status === 404) {
          setError('Test series not found');
        } else {
          setError(err.response?.data?.error || 'Failed to fetch test series data');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSeriesData();
  }, [seriesId]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleTestChange = (testId) => {
    setSelectedTest(testId);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            minHeight: '70vh',
            textAlign: 'center'
          }}
        >
          <ErrorOutlineIcon sx={{ fontSize: 64, color: theme.palette.error.main, mb: 2 }} />
          <Typography variant="h5" gutterBottom color="error">
            {error}
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<ArrowBackIcon />} 
            onClick={() => navigate('/test-series')}
            sx={{ mt: 2 }}
          >
            Back to Test Series
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link 
          component={RouterLink} 
          to="/" 
          underline="hover" 
          color="inherit"
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <HomeIcon sx={{ mr: 0.5, fontSize: 18 }} />
          Home
        </Link>
        <Link 
          component={RouterLink} 
          to="/test-series" 
          underline="hover" 
          color="inherit"
        >
          Test Series
        </Link>
        {seriesData && (
          <Link 
            component={RouterLink} 
            to={`/test-series/${seriesId}`} 
            underline="hover" 
            color="inherit"
          >
            {seriesData.title}
          </Link>
        )}
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
          <EmojiEventsIcon sx={{ mr: 0.5, fontSize: 18 }} />
          Leaderboard
        </Typography>
      </Breadcrumbs>

      {/* Series Header */}
      {seriesData && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            {seriesData.title} - Leaderboard
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            {seriesData.description?.substring(0, 150)}
            {seriesData.description?.length > 150 ? '...' : ''}
          </Typography>
        </Box>
      )}

      {/* Tab Navigation */}
      <Box sx={{ width: '100%', mb: 3 }}>
        <Paper 
          elevation={1}
          sx={{ 
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              '.MuiTabs-indicator': {
                height: 4,
                borderTopRightRadius: 4,
                borderTopLeftRadius: 4
              }
            }}
          >
            <Tab 
              value="overall" 
              label="Series Leaderboard" 
              sx={{ fontWeight: 600, py: 2 }}
            />
            <Tab 
              value="tests" 
              label="Individual Tests" 
              sx={{ fontWeight: 600, py: 2 }}
              disabled={!seriesData?.tests || seriesData.tests.length === 0}
            />
          </Tabs>
        </Paper>
      </Box>

      {/* Tab Contents */}
      {activeTab === 'overall' ? (
        <TestSeriesLeaderboard 
          seriesId={seriesId}
          seriesTitle={seriesData?.title}
        />
      ) : (
        <Box>
          {/* Test Selection */}
          {seriesData?.tests && seriesData.tests.length > 0 && (
            <Box>
              <Paper
                elevation={1}
                sx={{ 
                  p: 2, 
                  mb: 3, 
                  borderRadius: 2,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1
                }}
              >
                <Typography variant="subtitle1" fontWeight="bold" sx={{ width: '100%', mb: 1 }}>
                  Select a Test:
                </Typography>
                {seriesData.tests.map(test => (
                  <Button
                    key={test._id}
                    variant={selectedTest === test._id ? "contained" : "outlined"}
                    size="small"
                    onClick={() => handleTestChange(test._id)}
                    sx={{ 
                      borderRadius: 10,
                      px: 2,
                      textTransform: 'none'
                    }}
                  >
                    {test.title}
                  </Button>
                ))}
              </Paper>
              
              {/* Selected Test Leaderboard */}
              {selectedTest && (
                <Box sx={{ mb: 4 }}>
                  <TestSeriesLeaderboard 
                    seriesId={seriesId}
                    testId={selectedTest}
                    testTitle={seriesData.tests.find(t => t._id === selectedTest)?.title}
                  />
                </Box>
              )}
            </Box>
          )}
        </Box>
      )}
    </Container>
  );
};

export default TestSeriesLeaderboardPage; 