import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useExamCategory } from '../../contexts/ExamCategoryContext';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Divider,
  CircularProgress,
  Paper,
  Grid,
  Chip,
  IconButton,
  Alert,
  useTheme,
  Tooltip,
  Stack,
  InputAdornment,
  CardMedia
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import TimerIcon from '@mui/icons-material/Timer';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ImageIcon from '@mui/icons-material/Image';
import { toast } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

// Helper function to get image URL for a category
const getCategoryImage = (category) => {
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
  
  const key = category?.replace(/\s+/g, '');
  return categoryImages[key] || categoryImages.default;
};

// Helper to save image URL to cache
const saveImageUrlToCache = (seriesId, imageUrl) => {
  try {
    if (!seriesId || !imageUrl) return;
    
    // Get existing cache
    const imageCache = JSON.parse(localStorage.getItem('testSeriesImageCache') || '{}');
    
    // Update cache with new URL
    imageCache[seriesId] = imageUrl;
    
    // Save back to localStorage
    localStorage.setItem('testSeriesImageCache', JSON.stringify(imageCache));
    console.log('Saved image URL to cache:', seriesId, imageUrl);
  } catch (error) {
    console.error('Error saving image URL to cache:', error);
  }
};

// Helper to get image URL from cache
const getImageUrlFromCache = (seriesId) => {
  try {
    if (!seriesId) return null;
    const imageCache = JSON.parse(localStorage.getItem('testSeriesImageCache') || '{}');
    return imageCache[seriesId];
  } catch (error) {
    console.error('Error retrieving image from cache:', error);
    return null;
  }
};

const TestSeriesEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { api, user } = useAuth();
  const { categories } = useExamCategory();
  const theme = useTheme();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [testSeries, setTestSeries] = useState({
    title: '',
    description: '',
    category: '',
    price: 0,
    discount: 0,
    duration: '',
    totalTests: 0,
    students: 0,
    isPaid: false,
    popular: false,
    testsIncluded: [],
    imageUrl: '' // Add imageUrl field
  });

  const [newTest, setNewTest] = useState({
    title: '',
    duration: 30
  });
  
  // For custom image URL
  const [customImageUrl, setCustomImageUrl] = useState('');

  useEffect(() => {
    const fetchTestSeries = async () => {
      setLoading(true);
      try {
        // Only fetch if id is defined
        if (id && id !== 'undefined') {
          // Fetch test series by ID
          const response = await api.get(`/api/test-series/${id}`);
          if (response.data) {
            // Get cached image URL if available
            const cachedImageUrl = getImageUrlFromCache(id);
            
            // Set default imageUrl if not present, prioritize API value, then cache, then category default
            const seriesData = {
              ...response.data,
              imageUrl: response.data.imageUrl || cachedImageUrl || getCategoryImage(response.data.category)
            };
            
            setTestSeries(seriesData);
            setCustomImageUrl(seriesData.imageUrl);
            console.log('Loaded series with image URL:', seriesData.imageUrl, 
                        'API image:', response.data.imageUrl, 
                        'Cached image:', cachedImageUrl);
          } else {
            setError('Test series not found');
          }
        } else {
          // For new test series creation, use defaults
          setError('Invalid test series ID');
          navigate('/test-series');
        }
      } catch (error) {
        console.error('Error fetching test series:', error);
        setError('Failed to load test series data');
        toast.error('Could not load test series details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTestSeries();
    } else {
      // For new test series creation
      setLoading(false);
    }
  }, [id, api, navigate]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTestSeries(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // If category changes, update the default image
    if (name === 'category') {
      const newImageUrl = getCategoryImage(value);
      setTestSeries(prev => ({
        ...prev,
        imageUrl: customImageUrl || newImageUrl
      }));
    }
  };

  // Handle image URL change
  const handleImageUrlChange = (e) => {
    const url = e.target.value.trim();
    console.log('Setting image URL to:', url);
    setCustomImageUrl(url);
    
    // Make sure the URL is immediately updated in the main state
    setTestSeries(prev => {
      const updated = {
        ...prev,
        imageUrl: url
      };
      console.log('Updated testSeries state with new imageUrl:', updated);
      return updated;
    });
  };

  // Use default category image
  const useDefaultImage = () => {
    const defaultUrl = getCategoryImage(testSeries.category);
    setCustomImageUrl(defaultUrl);
    setTestSeries(prev => ({
      ...prev,
      imageUrl: defaultUrl
    }));
    toast.success('Using default category image');
  };

  // Handle number input changes with validation
  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    const numberValue = value === '' ? 0 : Number(value);
    
    if (!isNaN(numberValue)) {
      setTestSeries(prev => ({
        ...prev,
        [name]: numberValue
      }));
    }
  };

  // Handle new test input changes
  const handleNewTestChange = (e) => {
    const { name, value } = e.target;
    setNewTest(prev => ({
      ...prev,
      [name]: name === 'duration' ? (Number(value) || 30) : value
    }));
  };

  // Add a new test to the series
  const handleAddTest = () => {
    if (!newTest.title.trim()) {
      toast.error('Test title is required');
      return;
    }

    const testToAdd = {
      id: uuidv4(), // Generate a unique ID
      title: newTest.title,
      duration: newTest.duration
    };

    setTestSeries(prev => ({
      ...prev,
      testsIncluded: [...(prev.testsIncluded || []), testToAdd],
      totalTests: ((prev.testsIncluded || []).length + 1)
    }));

    // Reset the form
    setNewTest({
      title: '',
      duration: 30
    });
  };

  // Remove a test from the series
  const handleRemoveTest = (testId) => {
    setTestSeries(prev => {
      const updatedTests = (prev.testsIncluded || []).filter(test => test.id !== testId);
      return {
        ...prev,
        testsIncluded: updatedTests,
        totalTests: updatedTests.length
      };
    });
  };

  // Save the test series
  const handleSave = async () => {
    if (!testSeries.title || !testSeries.category) {
      toast.error('Title and category are required');
      return;
    }

    // Log the current state before saving
    console.log('Current testSeries state before save:', testSeries);
    console.log('Current customImageUrl before save:', customImageUrl);

    // Make a fresh copy with the latest image URL to ensure it's included
    const dataToSave = {
      ...testSeries,
      imageUrl: customImageUrl || testSeries.imageUrl || getCategoryImage(testSeries.category)
    };
    
    console.log('Final data being sent to API:', dataToSave);
    setSaving(true);
    try {
      let response;
      if (id && id !== 'undefined') {
        // Update existing test series with explicit imageUrl field
        console.log(`Sending PUT request to /api/test-series/${id} with data:`, dataToSave);
        response = await api.put(`/api/test-series/${id}`, dataToSave);
        console.log('API response after update:', response.data);
        
        // Save image URL to cache regardless of if backend stored it
        saveImageUrlToCache(id, dataToSave.imageUrl);
        
        toast.success('Test series updated successfully');
      } else {
        // Create new test series
        response = await api.post('/api/test-series', dataToSave);
        console.log('API response after create:', response.data);
        
        // If a new series was created successfully, cache the image URL
        if (response.data && (response.data._id || response.data.id)) {
          const newId = response.data._id || response.data.id;
          saveImageUrlToCache(newId, dataToSave.imageUrl);
        }
        
        toast.success('Test series created successfully');
      }
      
      navigate('/test-series');
    } catch (error) {
      console.error('Error saving test series:', error);
      // More detailed error message
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        toast.error(`Failed to save: ${error.response.data.message || error.message}`);
      } else {
        toast.error(`Failed to save: ${error.message}`);
      }
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this test series? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/api/test-series/${id}`);
      toast.success('Test series deleted successfully');
      navigate('/test-series');
    } catch (error) {
      console.error('Error deleting test series:', error);
      toast.error('Failed to delete test series');
    }
  };

  // Check user permissions
  useEffect(() => {
    if (user && user.role !== 'admin' && user.role !== 'teacher') {
      navigate('/test-series');
      toast.error('You do not have permission to edit test series');
    }
  }, [user, navigate]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/test-series')}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" component="h1" fontWeight="bold">
          {id ? 'Edit Test Series' : 'Create Test Series'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Basic Information
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Title"
              name="title"
              value={testSeries.title}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={testSeries.description}
              onChange={handleChange}
              multiline
              rows={4}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                name="category"
                value={testSeries.category}
                onChange={handleChange}
                label="Category"
                required
              >
                {categories
                  .filter(cat => cat !== 'all')
                  .map(category => (
                    <MenuItem key={category.id || category.name} value={category.name}>
                      {category.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Duration"
              name="duration"
              value={testSeries.duration}
              onChange={handleChange}
              placeholder="e.g., 2 hours, 3 days"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Image Section - Add clearer indication of the URL being used */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Test Series Image
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Current Image Preview
              </Typography>
              <CardMedia
                component="img"
                sx={{ 
                  height: 200, 
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: theme.palette.divider
                }}
                image={customImageUrl || testSeries.imageUrl || getCategoryImage(testSeries.category)}
                alt={testSeries.title}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {customImageUrl ? `Using custom URL: ${customImageUrl}` : 
                 testSeries.imageUrl ? `Using saved URL: ${testSeries.imageUrl}` : 
                 `Using default category image for ${testSeries.category}`}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
              <TextField
                fullWidth
                label="Image URL"
                name="imageUrl"
                value={customImageUrl}
                onChange={handleImageUrlChange}
                placeholder="Enter image URL"
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <ImageIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={useDefaultImage}
                  startIcon={<ImageIcon />}
                  sx={{ flexGrow: 1 }}
                >
                  Use Default Image
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    if (customImageUrl) {
                      console.log('Testing image URL:', customImageUrl);
                      toast.success('Image URL applied! Remember to save changes.');
                    } else {
                      toast.error('Please enter an image URL first');
                    }
                  }}
                  sx={{ flexGrow: 1 }}
                >
                  Test Image
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Pricing
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={
                <Switch
                  checked={testSeries.isPaid}
                  onChange={handleChange}
                  name="isPaid"
                  color="primary"
                />
              }
              label="Paid Test Series"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Price (₹)"
              name="price"
              type="number"
              value={testSeries.price}
              onChange={handleNumberChange}
              disabled={!testSeries.isPaid}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocalOfferIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Discount (%)"
              name="discount"
              type="number"
              value={testSeries.discount}
              onChange={handleNumberChange}
              disabled={!testSeries.isPaid}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    %
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={testSeries.popular}
                  onChange={handleChange}
                  name="popular"
                  color="secondary"
                />
              }
              label="Mark as Popular"
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Tests Included
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total: {testSeries.testsIncluded?.length || 0} tests
          </Typography>
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                label="Test Title"
                name="title"
                value={newTest.title}
                onChange={handleNewTestChange}
              />
            </Grid>
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                label="Duration (minutes)"
                name="duration"
                type="number"
                value={newTest.duration}
                onChange={handleNewTestChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <TimerIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={handleAddTest}
                startIcon={<AddIcon />}
                sx={{ height: '100%' }}
              >
                Add
              </Button>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* List of tests */}
        {(testSeries.testsIncluded || []).length === 0 ? (
          <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
            No tests added yet. Add tests to include in this series.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {(testSeries.testsIncluded || []).map((test, index) => (
              <Paper 
                key={test.id} 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  border: '1px solid',
                  borderColor: theme.palette.divider,
                  borderRadius: 1,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Box>
                  <Typography variant="body1" fontWeight="medium">
                    {index + 1}. {test.title}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <TimerIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {test.duration} minutes
                    </Typography>
                  </Box>
                </Box>
                <IconButton 
                  color="error" 
                  size="small" 
                  onClick={() => handleRemoveTest(test.id)}
                >
                  <RemoveIcon />
                </IconButton>
              </Paper>
            ))}
          </Stack>
        )}
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        {id && id !== 'undefined' && (
          <Button 
            variant="outlined" 
            color="error" 
            onClick={handleDelete}
            startIcon={<DeleteIcon />}
          >
            Delete
          </Button>
        )}
        <Box sx={{ ml: 'auto', display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined"
            onClick={() => navigate('/test-series')}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSave}
            startIcon={<SaveIcon />}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default TestSeriesEdit; 