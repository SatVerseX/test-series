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
  LinearProgress
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import SchoolIcon from '@mui/icons-material/School';
import TimerIcon from '@mui/icons-material/Timer';
import StarIcon from '@mui/icons-material/Star';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import AssignmentLateIcon from '@mui/icons-material/AssignmentLate';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import BarChartIcon from '@mui/icons-material/BarChart';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { motion } from 'framer-motion';
import { 
  Science as ScienceIcon,
  AccountBalance as AccountBalanceIcon,
  Train as TrainIcon,
  Book as BookIcon,
  Computer as ComputerIcon
} from '@mui/icons-material';

// Map category names to icon components
const getCategoryIcon = (categoryName) => {
  const category = categoryName.toLowerCase();
  
  if (category.includes('physics') || category.includes('chem') || 
      category.includes('science') || category.includes('biology')) {
    return <ScienceIcon fontSize="large" />;
  } else if (category.includes('math')) {
    return <BarChartIcon fontSize="large" />;
  } else if (category.includes('medical') || category.includes('neet')) {
    return <LocalFireDepartmentIcon fontSize="large" />;
  } else if (category.includes('bank') || category.includes('finance') || 
             category.includes('economy') || category.includes('upsc')) {
    return <AccountBalanceIcon fontSize="large" />;
  } else if (category.includes('railway') || category.includes('transport')) {
    return <TrainIcon fontSize="large" />;
  } else if (category.includes('history') || category.includes('geography') || 
             category.includes('social')) {
    return <BookIcon fontSize="large" />;
  } else if (category.includes('computer') || category.includes('programming') ||
             category.includes('coding') || category.includes('gate')) {
    return <ComputerIcon fontSize="large" />;
  } else {
    return <SchoolIcon fontSize="large" />;
  }
};

// Mock images for exam categories - replace with actual images in production
const categoryImages = {
  NDA: 'https://images.unsplash.com/photo-1579912437766-7896df6d3cd3',
  GATE: 'https://images.unsplash.com/photo-1580894908361-967195033215',
  JEE: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b',
  NEET: 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b',
  'CBSE-10': 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b',
  'CBSE-12': 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d',
  UPSC: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655',
  ICSE: 'https://images.unsplash.com/photo-1565022536102-f7f2c07f4ea4',
  Banking: 'https://images.unsplash.com/photo-1601597111158-2fceff292cdc',
  Railway: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3',
  SSC: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353',
  default: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173'
};

// Helper function to get image URL for a category
const getCategoryImage = (category) => {
  const key = category.replace(/\s+/g, '');
  return categoryImages[key] || categoryImages.default;
};

// Helper function to convert string color name to theme color value
const getColorByName = (colorName, theme) => {
  switch(colorName) {
    case 'success.main': return theme.palette.success.main;
    case 'warning.main': return theme.palette.warning.main;
    case 'error.main': return theme.palette.error.main;
    default: return theme.palette.info.main;
  }
};

// Helper function to get difficulty label and color
const getDifficultyInfo = (difficulty) => {
  const difficultyMap = {
    easy: { label: 'Easy', color: 'success.main', level: 1 },
    medium: { label: 'Medium', color: 'warning.main', level: 2 },
    hard: { label: 'Hard', color: 'error.main', level: 3 },
  };
  
  return difficultyMap[difficulty?.toLowerCase()] || { label: 'Medium', color: 'warning.main', level: 2 };
};

// Helper function to get exam icon (you would replace this with actual icons for each exam)
const getExamIcon = (category) => {
  const iconMap = {
    'NDA': <SchoolIcon />,
    'GATE': <BarChartIcon />,
    'JEE': <MenuBookIcon />,
    'NEET': <LocalFireDepartmentIcon />,
    'CBSE-10': <SchoolIcon />,
    'CBSE-12': <SchoolIcon />,
    'UPSC': <SchoolIcon />,
    'Banking': <SchoolIcon />,
    'Railway': <SchoolIcon />,
    'SSC': <SchoolIcon />,
  };
  
  return iconMap[category] || <SchoolIcon />;
};

const TestCategoryList = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, api } = useAuth();
  const { selectedCategory: globalCategory, selectCategory: setGlobalCategory } = useExamCategory();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tests, setTests] = useState([]);
  const [userAttempts, setUserAttempts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // When globalCategory changes, update the local selection
  useEffect(() => {
    if (globalCategory) {
      setSelectedCategory(globalCategory);
    }
  }, [globalCategory]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all tests with category filter if set
        const params = { limit: 100, status: 'published' };
        if (globalCategory && globalCategory !== 'all') {
          params.category = globalCategory;
        }
        
        const testsResponse = await api.get('/api/tests', { params });
        
        const allTests = testsResponse.data.tests || [];
        
        // Group tests by exam category instead of subject
        const processedTests = allTests.map(test => ({
          ...test,
          // Use the test.category field if it exists, otherwise fallback to subject
          examCategory: test.category || test.subject || 'General'
        }));
        
        setTests(processedTests);
        
        // Extract unique exam categories
        const uniqueCategories = [...new Set(processedTests.map(test => test.examCategory))];
        setCategories(['all', ...uniqueCategories]);
        
        // Fetch user's test attempts
        if (user) {
          // Remove any cache busting for stats endpoint to avoid CORS issues
          const statsResponse = await api.get(`/api/users/${user.firebaseId}/stats`);
          const attempts = statsResponse.data.recentTests || [];
          setUserAttempts(attempts);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load tests. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [api, user, globalCategory]);

  // Handle category tab change and update global context
  const handleCategoryChange = (event, newValue) => {
    setSelectedCategory(newValue);
    // Update the global category context
    setGlobalCategory(newValue);
  };

  // Handle search query change
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  // Check if a test has been attempted by the user
  const getTestStatus = (testId) => {
    const attempt = userAttempts.find(a => a.testId === testId);
    if (!attempt) return { status: 'not_attempted', label: 'Not Attempted', color: 'default' };
    
    if (attempt.status === 'in_progress') {
      return { status: 'in_progress', label: 'In Progress', color: 'warning' };
    }
    
    // Test is completed
    return { 
      status: 'completed', 
      label: attempt.passed ? 'Passed' : 'Failed', 
      color: attempt.passed ? 'success' : 'error',
      score: attempt.score
    };
  };

  // Filter tests by selected category and search query
  const filteredTests = tests
    .filter(test => {
      // Category filter
      if (selectedCategory !== 'all' && test.examCategory !== selectedCategory) {
        return false;
      }
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          test.title?.toLowerCase().includes(query) ||
          test.subject?.toLowerCase().includes(query) ||
          test.description?.toLowerCase().includes(query) ||
          test.category?.toLowerCase().includes(query)
        );
      }
      
      return true;
    });

  // Group tests by exam category
  const testsByCategory = {};
  filteredTests.forEach(test => {
    const category = test.examCategory || 'Uncategorized';
    if (!testsByCategory[category]) {
      testsByCategory[category] = [];
    }
    testsByCategory[category].push(test);
  });

  // Handler for test card click
  const handleTestClick = (test) => {
    const testStatus = getTestStatus(test._id);
    
    if (testStatus.status === 'completed') {
      // Navigate to test results
      navigate(`/test-results/${test._id}/${user.firebaseId}`);
    } else if (testStatus.status === 'in_progress') {
      // Continue the test
      navigate(`/test-attempt/${test._id}`);
    } else {
      // Start new test
      navigate(`/test-attempt/${test._id}`);
    }
  };

  // Get color based on test status for card styling
  const getCardColor = (testId) => {
    const status = getTestStatus(testId);
    
    if (status.status === 'not_attempted') {
      return theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)';
    } else if (status.status === 'in_progress') {
      return alpha(theme.palette.warning.main, 0.1);
    } else if (status.label === 'Passed') {
      return alpha(theme.palette.success.main, 0.1);
    } else {
      return alpha(theme.palette.error.main, 0.1);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box 
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        sx={{ mb: 4 }}
      >
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom
          sx={{ 
            fontWeight: 'bold',
            color: theme.palette.primary.main,
            textAlign: 'center',
            mb: 3
          }}
        >
          Exam Preparation Center
        </Typography>
        
        <Paper 
          elevation={3} 
          sx={{ 
            p: 3,
            mb: 4,
            borderRadius: 2,
            background: theme.palette.mode === 'dark' 
              ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.4)} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)` 
              : `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.1)} 0%, #ffffff 100%)`,
          }}
        >
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>
                Find Your Exam Preparation Tests
              </Typography>
              <Typography variant="body1" paragraph color="text.secondary">
                Browse our comprehensive collection of entrance and competitive exam preparation tests. 
                Track your progress and improve your scores with our powerful analytics.
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                <Chip 
                  icon={<CheckCircleIcon />} 
                  label="Passed" 
                  color="success" 
                  variant="outlined" 
                />
                <Chip 
                  icon={<AssignmentLateIcon />} 
                  label="Failed" 
                  color="error" 
                  variant="outlined" 
                />
                <Chip 
                  icon={<PendingIcon />} 
                  label="In Progress" 
                  color="warning" 
                  variant="outlined" 
                />
                <Chip 
                  icon={<AssignmentTurnedInIcon />} 
                  label="Not Attempted" 
                  color="default" 
                  variant="outlined" 
                />
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
                <TextField
                  placeholder="Search exams and tests..."
                  variant="outlined"
                  fullWidth
                  sx={{ mb: 2 }}
                  value={searchQuery}
                  onChange={handleSearchChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  variant="outlined"
                  startIcon={<FilterListIcon />}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Advanced Filters
                </Button>
              </Box>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                  <LocalFireDepartmentIcon />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">Trending</Typography>
                  <Typography variant="subtitle1" fontWeight="bold">JEE Mains</Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ bgcolor: theme.palette.success.main }}>
                  <TrendingUpIcon />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">Your Progress</Typography>
                  <Typography variant="subtitle1" fontWeight="bold">7 Tests Completed</Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ bgcolor: theme.palette.warning.main }}>
                  <MenuBookIcon />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">Available Tests</Typography>
                  <Typography variant="subtitle1" fontWeight="bold">{tests.length} Tests</Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ bgcolor: theme.palette.info.main }}>
                  <CalendarTodayIcon />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">Next Update</Typography>
                  <Typography variant="subtitle1" fontWeight="bold">Tomorrow</Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

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
            label="All Exams" 
            value="all"
            icon={<SchoolIcon />}
            iconPosition="start"
          />
          
          {categories.filter(cat => cat !== 'all').map(category => (
            <Tab 
              key={category} 
              label={category} 
              value={category}
              icon={getCategoryIcon(category)}
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

      {/* Selected category information */}
      {selectedCategory !== 'all' && (
        <Paper 
          elevation={1} 
          sx={{ 
            p: 2, 
            mb: 3, 
            borderRadius: 2,
            background: alpha(theme.palette.primary.light, 0.05),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          }}
        >
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar 
                  src={getCategoryImage(selectedCategory)}
                  sx={{ 
                    width: 60, 
                    height: 60,
                    border: `2px solid ${theme.palette.primary.main}`
                  }}
                />
                <Box>
                  <Typography variant="h5" fontWeight="bold">{selectedCategory} Exam Preparation</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Comprehensive test series designed to help you excel in your {selectedCategory} exam
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={2} justifyContent={{ xs: 'flex-start', md: 'flex-end' }} alignItems="center" height="100%">
                <Chip 
                  label={`${testsByCategory[selectedCategory]?.length || 0} Tests Available`} 
                  color="primary" 
                  variant="outlined" 
                  icon={<AssignmentTurnedInIcon />}
                />
                <Button 
                  variant="contained" 
                  color="primary"
                  startIcon={<PlayArrowIcon />}
                >
                  Start Series
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>
      )}

      {Object.keys(testsByCategory).length === 0 ? (
        <Typography variant="h6" color="text.secondary" align="center" sx={{ py: 5 }}>
          No tests found for the selected category.
        </Typography>
      ) : (
        Object.entries(testsByCategory).map(([category, categoryTests]) => (
          <Box key={category} sx={{ mb: 6 }} component={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            {selectedCategory === 'all' && (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar 
                    src={getCategoryImage(category)}
                    sx={{ 
                      width: 40, 
                      height: 40, 
                      mr: 2,
                      border: `2px solid ${theme.palette.primary.main}`
                    }}
                  />
                  <Typography 
                    variant="h5" 
                    component="h2"
                    sx={{ 
                      fontWeight: 'bold',
                      color: theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.dark
                    }}
                  >
                    {category}
                  </Typography>
                  <Box sx={{ flexGrow: 1 }}></Box>
                  <Button 
                    variant="outlined" 
                    size="small"
                    onClick={() => setSelectedCategory(category)}
                    endIcon={<ArrowForwardIcon />}
                  >
                    View All
                  </Button>
                </Box>
                <Divider sx={{ mb: 3 }} />
              </>
            )}
            
            <Grid container spacing={3}>
              {categoryTests.map((test, index) => {
                const testStatus = getTestStatus(test._id);
                const cardBgColor = getCardColor(test._id);
                const difficultyInfo = getDifficultyInfo(test.difficulty);
                
                return (
                  <Grid 
                    item 
                    xs={12} 
                    sm={6} 
                    md={4} 
                    lg={3} 
                    key={test._id}
                    component={motion.div}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Zoom in={true} style={{ transitionDelay: `${index * 50}ms` }}>
                      <Card 
                        sx={{ 
                          height: '100%', 
                          display: 'flex', 
                          flexDirection: 'column',
                          backgroundColor: cardBgColor,
                          borderRadius: 2,
                          overflow: 'hidden',
                          transition: 'all 0.3s ease-in-out',
                          border: '1px solid',
                          borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                          '&:hover': {
                            transform: 'translateY(-5px)',
                            boxShadow: '0 12px 20px rgba(0,0,0,0.1)',
                          }
                        }}
                      >
                        <CardMedia
                          component="img"
                          height="140"
                          image={getCategoryImage(category)}
                          alt={test.title}
                          sx={{ 
                            opacity: testStatus.status === 'not_attempted' ? 1 : 0.8,
                            filter: testStatus.status === 'not_attempted' ? 'none' : 'grayscale(30%)'
                          }}
                        />
                        <Box 
                          sx={{ 
                            position: 'absolute', 
                            top: 10, 
                            right: 10,
                            zIndex: 2
                          }}
                        >
                          <Chip
                            size="small"
                            label={testStatus.label}
                            color={testStatus.color}
                            sx={{ 
                              fontWeight: 'bold',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                            }}
                            icon={
                              testStatus.status === 'completed' ? 
                                (testStatus.label === 'Passed' ? <CheckCircleIcon /> : <AssignmentLateIcon />) :
                              testStatus.status === 'in_progress' ? <PendingIcon /> : <AssignmentTurnedInIcon />
                            }
                          />
                        </Box>
                        
                        <Box 
                          sx={{ 
                            position: 'absolute', 
                            top: 110, 
                            left: 10,
                            bgcolor: 'rgba(0,0,0,0.7)',
                            color: 'white',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            fontSize: '0.75rem',
                            fontWeight: 'bold'
                          }}
                        >
                          {category}
                        </Box>
                        
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Typography 
                            gutterBottom 
                            variant="h6" 
                            component="div"
                            sx={{ 
                              fontWeight: 'bold',
                              color: theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.dark,
                              height: '3em',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                            }}
                          >
                            {test.title}
                          </Typography>
                          
                          <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                            <Chip 
                              label={difficultyInfo.label} 
                              size="small" 
                              sx={{ 
                                bgcolor: alpha(getColorByName(difficultyInfo.color, theme), 0.1),
                                color: getColorByName(difficultyInfo.color, theme),
                                fontWeight: 'bold'
                              }} 
                            />
                            {test.popular && (
                              <Chip 
                                label="Popular" 
                                size="small" 
                                sx={{ 
                                  bgcolor: alpha(theme.palette.error.main, 0.1),
                                  color: theme.palette.error.main,
                                  fontWeight: 'bold'
                                }} 
                              />
                            )}
                          </Stack>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <TimerIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {test.duration} minutes
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <StarIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {test.passingScore}% to pass
                            </Typography>
                          </Box>
                          
                          {test.questions && (
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <AssignmentTurnedInIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {test.questions.length} questions
                              </Typography>
                            </Box>
                          )}
                          
                          {testStatus.status === 'completed' && (
                            <Box sx={{ 
                              mt: 1, 
                              p: 1, 
                              borderRadius: 1,
                              bgcolor: alpha(testStatus.label === 'Passed' ? theme.palette.success.main : theme.palette.error.main, 0.1)
                            }}>
                              <Typography 
                                variant="body1" 
                                sx={{ 
                                  fontWeight: 'bold',
                                  color: testStatus.label === 'Passed' ? theme.palette.success.main : theme.palette.error.main
                                }}
                              >
                                Score: {testStatus.score?.toFixed(0)}%
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={testStatus.score || 0}
                                sx={{
                                  mt: 0.5,
                                  height: 6,
                                  borderRadius: 3,
                                  bgcolor: alpha(testStatus.label === 'Passed' ? theme.palette.success.main : theme.palette.error.main, 0.2),
                                  '& .MuiLinearProgress-bar': {
                                    bgcolor: testStatus.label === 'Passed' ? theme.palette.success.main : theme.palette.error.main,
                                  }
                                }}
                              />
                            </Box>
                          )}
                        </CardContent>
                        
                        <CardActions sx={{ p: 2, pt: 0 }}>
                          <Button 
                            fullWidth 
                            variant="contained" 
                            color={
                              testStatus.status === 'not_attempted' ? 'primary' : 
                              testStatus.status === 'in_progress' ? 'warning' : 
                              testStatus.label === 'Passed' ? 'success' : 'error'
                            }
                            onClick={() => handleTestClick(test)}
                            startIcon={
                              testStatus.status === 'not_attempted' ? <PlayArrowIcon /> : 
                              testStatus.status === 'in_progress' ? <PendingIcon /> : 
                              <RestartAltIcon />
                            }
                            sx={{ 
                              borderRadius: 2,
                              boxShadow: theme.shadows[2],
                              textTransform: 'none',
                              fontWeight: 'bold'
                            }}
                          >
                            {testStatus.status === 'not_attempted' ? 'Start Test' : 
                             testStatus.status === 'in_progress' ? 'Continue' : 
                             'View Results'}
                          </Button>
                        </CardActions>
                      </Card>
                    </Zoom>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        ))
      )}
      
      {/* Exam Preparation Tips Section */}
      <Paper 
        elevation={2} 
        sx={{ 
          p: 3, 
          mt: 4, 
          borderRadius: 2,
          background: theme.palette.mode === 'dark' 
            ? alpha(theme.palette.primary.dark, 0.1)
            : alpha(theme.palette.primary.light, 0.1)
        }}
      >
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
          Exam Preparation Tips
        </Typography>
        <Typography variant="body1" paragraph>
          Prepare effectively for your exams with these expert tips:
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Avatar sx={{ bgcolor: theme.palette.primary.main }}>1</Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">Regular Practice</Typography>
                <Typography variant="body2">Take at least one practice test every week to build confidence and identify weak areas.</Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Avatar sx={{ bgcolor: theme.palette.primary.main }}>2</Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">Review Mistakes</Typography>
                <Typography variant="body2">Carefully analyze your incorrect answers to understand concepts you need to focus on.</Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Avatar sx={{ bgcolor: theme.palette.primary.main }}>3</Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">Time Management</Typography>
                <Typography variant="body2">Practice with timed tests to improve your speed and accuracy under exam conditions.</Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default TestCategoryList; 