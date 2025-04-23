import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useExamCategory } from '../../contexts/ExamCategoryContext';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Chip,
  Button,
  CircularProgress,
  Divider,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardActions,
  CardMedia,
  Avatar,
  useTheme,
  alpha,
  Fade,
  Zoom,
  Alert,
  InputAdornment,
  TextField,
  Badge,
  Stack,
  LinearProgress,
  IconButton,
  Tooltip,
  CardHeader
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import SchoolIcon from '@mui/icons-material/School';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import TimerIcon from '@mui/icons-material/Timer';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import EditIcon from '@mui/icons-material/Edit';
import BarChartIcon from '@mui/icons-material/BarChart';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import TestSeriesCard from '../../components/tests/TestSeriesCard';
import { useTheme as useThemeMui } from '@mui/material/styles';

// Mock images for categories - replace with actual images in production
const categoryImages = {
  SSC: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353',
  UPSC: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655',
  JEE: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b',
  NEET: 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b',
  GATE: 'https://images.unsplash.com/photo-1580894908361-967195033215',
  Banking: 'https://images.unsplash.com/photo-1601597111158-2fceff292cdc',
  Railway: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3',
  CBSE: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b',
  default: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173'
};

// Helper function to get image URL for a category
const getCategoryImage = (category) => {
  const key = category?.replace(/\s+/g, '');
  return categoryImages[key] || categoryImages.default;
};

// Helper function to get color for a subject
const getColorForSubject = (subject) => {
  if (!subject) return '#2196F3'; // Default blue
  
  const subjectLower = subject.toLowerCase();
  
  if (subjectLower.includes('math') || subjectLower.includes('mathematics')) {
    return '#4CAF50'; // Green
  } else if (subjectLower.includes('physics')) {
    return '#2196F3'; // Blue
  } else if (subjectLower.includes('chemistry')) {
    return '#9C27B0'; // Purple
  } else if (subjectLower.includes('biology')) {
    return '#FF5722'; // Deep Orange
  } else if (subjectLower.includes('computer') || subjectLower.includes('programming')) {
    return '#607D8B'; // Blue Grey
  } else if (subjectLower.includes('english') || subjectLower.includes('language')) {
    return '#00BCD4'; // Cyan
  } else if (subjectLower.includes('history')) {
    return '#795548'; // Brown
  } else if (subjectLower.includes('geography')) {
    return '#009688'; // Teal
  } else if (subjectLower.includes('science')) {
    return '#3F51B5'; // Indigo
  } else if (subjectLower.includes('economics')) {
    return '#FF9800'; // Orange
  } else {
    return '#2196F3'; // Default blue
  }
};

// Helper function to get icon for a subject
const getIconForSubject = (subject) => {
  if (!subject) return <SchoolIcon fontSize="small" />;
  
  const subjectLower = subject.toLowerCase();
  
  if (subjectLower.includes('math') || subjectLower.includes('mathematics')) {
    return <BarChartIcon fontSize="small" />;
  } else if (subjectLower.includes('physics') || subjectLower.includes('chemistry') || 
             subjectLower.includes('biology') || subjectLower.includes('science')) {
    return <SchoolIcon fontSize="small" />;
  } else if (subjectLower.includes('computer') || subjectLower.includes('programming')) {
    return <SchoolIcon fontSize="small" />;
  } else if (subjectLower.includes('english') || subjectLower.includes('language')) {
    return <SchoolIcon fontSize="small" />;
  } else if (subjectLower.includes('history') || subjectLower.includes('geography')) {
    return <SchoolIcon fontSize="small" />;
  } else if (subjectLower.includes('economics')) {
    return <SchoolIcon fontSize="small" />;
  } else {
    return <SchoolIcon fontSize="small" />;
  }
};

// Helper to manage image URL cache
const getImageUrlFromCache = (seriesId) => {
  try {
    const imageCache = JSON.parse(localStorage.getItem('testSeriesImageCache') || '{}');
    return imageCache[seriesId];
  } catch (error) {
    console.error('Error retrieving image cache:', error);
    return null;
  }
};

const TestSeriesList = () => {
  const theme = useTheme();
  const themeMui = useThemeMui();
  const navigate = useNavigate();
  const { user, api } = useAuth();
  const { categories } = useExamCategory();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testSeries, setTestSeries] = useState([]);
  const [purchasedSeries, setPurchasedSeries] = useState([]);
  const [subscribedSeries, setSubscribedSeries] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch test series data
  useEffect(() => {
    const fetchTestSeries = async () => {
      setLoading(true);
      try {
        // Get test series list - this API exists
        const response = await api.get('/api/test-series');
        console.log('API Response Data (Raw):', response.data);
        
        // Add more detailed debugging
        if (response.data && response.data.length > 0) {
          console.log('First series tests:', {
            testsIncluded: response.data[0].testsIncluded,
            tests: response.data[0].tests,
            totalTests: response.data[0].totalTests
          });
        }
        
        // Add a check if series.id exists before trying to map series and image
        const processedData = (response.data || []).map(series => {
          const cachedImageUrl = getImageUrlFromCache(series._id || series.id);
          console.log('Processing series:', series.title, 
                      'API Image URL:', series.imageUrl, 
                      'Cached Image URL:', cachedImageUrl);
          
          // Handle different possible test property names in the API response
          const testsIncluded = series.testsIncluded || series.tests || [];
          
          return {
            ...series,
            id: series.id || series._id, // Ensure id exists, fallback to _id
            imageUrl: series.imageUrl || cachedImageUrl || null, // Try API image first, then cached, then null
            testsIncluded: testsIncluded.map(test => ({
              id: test.id || test._id,
              title: test.title || test.name || 'Untitled Test',
              duration: test.duration || test.timeLimit || 30
            }))
          };
        });
        
        console.log('Processed test series data:', processedData);

        // Try to get user's purchased series - this API might not exist yet
        try {
          const purchasedResponse = await api.get('/api/test-series/user/purchased');
          if (purchasedResponse.data) {
            console.log('Purchased series data:', purchasedResponse.data);
            // This now includes progress information
            setPurchasedSeries(purchasedResponse.data || []);
          }
        } catch (purchaseError) {
          console.warn('User purchases API not implemented yet:', purchaseError);
          // Fallback to mock data with progress
          setPurchasedSeries([
            // Mock data with progress
            {
              _id: processedData[0]?._id || '',
              progress: {
                testsAttempted: 2,
                testsCompleted: 1,
                averageScore: 75
              }
            }
          ]);
          toast('Purchases API not implemented yet. Using mock data.', {
            icon: '⚠️',
            style: {
              borderRadius: '10px',
              background: '#FFF3CD',
              color: '#856404',
            },
          });
        }

        // Try to get user's subscribed series
        try {
          const subscribedResponse = await api.get('/api/test-series/user/subscribed');
          if (subscribedResponse.data) {
            console.log('Subscribed series data:', subscribedResponse.data);
            setSubscribedSeries(subscribedResponse.data || []);
          }
        } catch (subscribeError) {
          console.warn('User subscriptions API not implemented yet:', subscribeError);
          // Use empty array for subscribed series if API fails
          setSubscribedSeries([]);
        }

        // If no tests in response, try to fetch associated tests for each series
        const processedSeriesWithTests = [...processedData];
        const seriesWithNoTests = processedData.filter(series => 
          (!series.testsIncluded || series.testsIncluded.length === 0) && 
          (!series.tests || series.tests.length === 0)
        );

        if (seriesWithNoTests.length > 0) {
          try {
            // Fetch tests for each series without tests
            for (const series of seriesWithNoTests) {
              const seriesId = series.id || series._id;
              console.log(`Fetching tests for series: ${seriesId}`);
              
              const testsResponse = await api.get(`/api/test-series/${seriesId}/tests`);
              if (testsResponse.data && testsResponse.data.length > 0) {
                console.log(`Found ${testsResponse.data.length} tests for series ${seriesId}`);
                
                // Update the series with tests
                const seriesIndex = processedSeriesWithTests.findIndex(s => 
                  (s.id === seriesId) || (s._id === seriesId)
                );
                
                if (seriesIndex !== -1) {
                  processedSeriesWithTests[seriesIndex].testsIncluded = testsResponse.data.map(test => ({
                    id: test.id || test._id,
                    title: test.title || test.name || 'Untitled Test',
                    duration: test.duration || test.timeLimit || 30
                  }));
                  console.log(`Updated series ${seriesId} with tests:`, 
                    processedSeriesWithTests[seriesIndex].testsIncluded);
                }
              }
            }
            // Update the state with the enhanced data
            setTestSeries(processedSeriesWithTests);
          } catch (testsError) {
            console.warn('Error fetching tests for series:', testsError);
            // Still use the data we have even if fetching tests failed
            setTestSeries(processedData);
          }
        } else {
          setTestSeries(processedData);
        }
      } catch (error) {
        console.error('Error fetching test series:', error);
        toast.error('Could not load test series.');
        setTestSeries([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTestSeries();
  }, [api]);

  // Handle category tab change
  const handleCategoryChange = (event, newValue) => {
    setSelectedCategory(newValue);
  };

  // Handle search query change
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  // Check if user has purchased a test series
  const hasPurchased = (seriesId) => {
    if (!seriesId) return false;
    return purchasedSeries.some(series => series._id === seriesId);
  };

  // Check if user has subscribed to a test series
  const hasSubscribed = (seriesId) => {
    if (!seriesId) return false;
    return subscribedSeries.some(series => series._id === seriesId);
  };

  // Handle unlock/purchase test series
  const handleUnlockSeries = (series) => {
    if (!user) {
      // Redirect to login if not logged in
      navigate('/login', { state: { from: `/test-series/${series._id}` } });
      return;
    }

    if (series.isPaid) {
      // In a real app, redirect to payment gateway
      navigate(`/checkout/test-series/${series._id}`);
    } else {
      // For free test series, just mark as purchased
      const newPurchasedSeries = [
        ...purchasedSeries,
        {
          _id: series._id,
          title: series.title,
          progress: {
            testsAttempted: 0,
            testsCompleted: 0,
            averageScore: 0
          }
        }
      ];
      setPurchasedSeries(newPurchasedSeries);
      toast.success('Test series added to your library!');
      // In a real app, you would save this to the database
    }
  };

  // Handle starting a test series
  const handleStartSeries = (series) => {
    // Navigate to the test series detail page
    navigate(`/test-series/${series._id}`);
  };

  // Handle subscribing to a test series
  const handleSubscribeSeries = async (seriesId) => {
    if (!user) {
      // Redirect to login if not logged in
      navigate('/login', { state: { from: `/test-series/${seriesId}` } });
      return false;
    }

    try {
      // Make API call to subscribe to the series
      await api.post(`/api/test-series/${seriesId}/subscribe`);
      
      // Update local state
      setSubscribedSeries(prev => [...prev, seriesId]);
      
      toast.success('Successfully subscribed to test series!');
      return true; // Return success to the component
    } catch (error) {
      console.error('Error subscribing to test series:', error);
      toast.error('Failed to subscribe to test series. Please try again.');
      return false; // Return failure to the component
    }
  };

  // Filter test series by selected category and search query
  const filteredSeries = testSeries.filter(series => {
    // Add console log to debug test series data
    console.log('Series data:', series.title, 'tests:', series.testsIncluded);
    
    // Category filter
    if (selectedCategory !== 'all' && series.category !== selectedCategory) {
      return false;
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        series.title.toLowerCase().includes(query) ||
        series.description.toLowerCase().includes(query) ||
        series.category.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  // Calculate discounted price
  const getDiscountedPrice = (price, discount) => {
    if (!discount) return price;
    return price - (price * discount / 100);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 8 }}>
      <Container maxWidth="xl">
        <Box
          sx={{
            position: 'relative',
            mb: 6,
            mt: 2,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.9)}, ${alpha(theme.palette.primary.main, 0.8)})`,
            borderRadius: 3,
            overflow: 'hidden',
            py: 4,
            px: { xs: 3, md: 5 },
            boxShadow: `0 10px 40px ${alpha(theme.palette.primary.main, 0.2)}`,
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0.1,
              backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")',
              zIndex: 0,
            }}
          />
          
          <Grid container spacing={3} alignItems="center" sx={{ position: 'relative', zIndex: 1 }}>
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography 
                  component="h1" 
                  variant="h3"
                  fontWeight="bold"
                  color="white"
                  sx={{ 
                    textShadow: '0 2px 10px rgba(0,0,0,0.2)',
                    fontSize: { xs: '2rem', md: '2.5rem' }
                  }}
                >
                  Test Series
                </Typography>
                
                {/* Admin Button */}
                {user && (user.role === 'admin' || user.role === 'teacher') && (
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<AssignmentIcon />}
                    onClick={() => navigate('/test-series/create')}
                    sx={{ 
                      fontWeight: 'bold',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                      textTransform: 'none',
                      borderRadius: 2,
                      px: 2,
                      py: 1
                    }}
                  >
                    Create Series
                  </Button>
                )}
              </Box>
              
              <Typography 
                variant="h6" 
                color="white" 
                sx={{ 
                  opacity: 0.9,
                  fontWeight: 'normal',
                  maxWidth: 700,
                  fontSize: { xs: '1rem', md: '1.2rem' }
                }}
              >
                Prepare for your exams with our comprehensive test series. Choose from a variety of subjects and difficulty levels.
              </Typography>
              
              <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                <Chip 
                  icon={<LockOpenIcon />} 
                  label="Free" 
                  color="success" 
                  variant="filled" 
                  sx={{ fontWeight: 'bold', px: 1, backgroundColor: 'success.main', color: 'white' }}
                />
                <Chip 
                  icon={<MonetizationOnIcon />} 
                  label="Premium" 
                  color="primary" 
                  variant="filled" 
                  sx={{ fontWeight: 'bold', px: 1, backgroundColor: 'white', color: 'primary.main' }}
                />
              </Stack>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  height: '100%', 
                  justifyContent: 'center',
                  position: 'relative',
                  zIndex: 1
                }}
              >
                <TextField
                  placeholder="Search test series..."
                  variant="outlined"
                  fullWidth
                  value={searchQuery}
                  onChange={handleSearchChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: 'white' }} />
                      </InputAdornment>
                    ),
                    sx: {
                      backgroundColor: alpha(theme.palette.background.paper, 0.1),
                      borderRadius: 2,
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: alpha(theme.palette.background.paper, 0.3),
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: alpha(theme.palette.background.paper, 0.5),
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.background.paper,
                      },
                      '& .MuiInputBase-input': {
                        color: 'white',
                        '&::placeholder': {
                          color: alpha(theme.palette.background.paper, 0.7),
                          opacity: 1,
                        },
                      },
                    },
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={selectedCategory} 
            onChange={handleCategoryChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ 
              '& .MuiTab-root': {
                fontSize: '1rem',
                textTransform: 'none',
                fontWeight: 'medium',
                minWidth: 120,
                py: 1.5,
              },
              '& .Mui-selected': {
                fontWeight: 'bold',
                color: theme.palette.primary.main
              }
            }}
          >
            <Tab 
              key="all" 
              label="All Categories" 
              value="all"
              icon={<SchoolIcon />}
              iconPosition="start"
            />
            
            {categories.filter(cat => cat !== 'all').map(category => (
              <Tab 
                key={category.name || category.id || `category-${Math.random()}`} 
                label={category.name} 
                value={category.name}
                iconPosition="start"
                sx={{ 
                  borderRadius: 1,
                  '&.Mui-selected': {
                    background: alpha(theme.palette.primary.main, 0.1),
                  }
                }}
              />
            ))}
          </Tabs>
        </Box>

        {filteredSeries.length === 0 ? (
          <Box sx={{ 
            py: 10, 
            textAlign: 'center',
            background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.background.default, 0)} 100%)`,
            borderRadius: 2
          }}>
            <Typography variant="h6" color="text.secondary" align="center">
              No test series found for the selected criteria.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Try changing the category or search term.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={4} sx={{ mt: 2 }}>
            {filteredSeries.map((series, index) => {
              const isPurchased = hasPurchased(series._id);
              const isSubscribed = hasSubscribed(series._id);
              const progress = purchasedSeries.find(s => s._id === series._id)?.progress;
              
              return (
                <Grid item xs={12} sm={6} md={4} key={series._id || index}>
                  <TestSeriesCard 
                    series={series}
                    isPurchased={isPurchased}
                    isSubscribed={isSubscribed}
                    progress={progress}
                    onUnlock={handleUnlockSeries}
                    onStart={handleStartSeries}
                    onSubscribe={handleSubscribeSeries}
                    delay={index * 0.05}
                  />
                </Grid>
              );
            })}
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default TestSeriesList; 