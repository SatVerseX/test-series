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
  Divider,
  Card,
  CardContent,
  CardActions,
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
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  Edit as EditIcon, 
  Info as InfoIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { useExamCategory } from '../../contexts/ExamCategoryContext';

const TestSeriesForm = () => {
  const navigate = useNavigate();
  const { seriesId } = useParams();
  const { api, user } = useAuth();
  const { categories } = useExamCategory();
  
  const [seriesData, setSeriesData] = useState({
    title: '',
    description: '',
    category: '',
    subject: '',
    isPaid: false,
    price: 0,
    discount: 0,
    accessDuration: 'Unlimited',
    coverImage: '',
    testsIncluded: []
  });
  
  const [availableTests, setAvailableTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!seriesId);
  const [error, setError] = useState('');
  const [isEditMode, setIsEditMode] = useState(!!seriesId);
  const [showAddTestsDialog, setShowAddTestsDialog] = useState(false);
  const [selectedTests, setSelectedTests] = useState([]);
  
  // Duration options
  const durationOptions = [
    { value: 'Unlimited', label: 'Unlimited' },
    { value: '7 days', label: '7 days' },
    { value: '30 days', label: '30 days' },
    { value: '90 days', label: '3 months' },
    { value: '180 days', label: '6 months' },
    { value: '365 days', label: '1 year' }
  ];

  // Fetch existing series data if in edit mode
  useEffect(() => {
    const fetchSeries = async () => {
      if (!seriesId) return;
      
      try {
        setInitialLoading(true);
        const response = await api.get(`/api/test-series/${seriesId}`);
        
        if (response.data) {
          setSeriesData(response.data);
          toast.success('Test series loaded successfully');
        }
      } catch (error) {
        console.error('Error fetching test series:', error);
        toast.error('Error loading test series: ' + (error.response?.data?.message || error.message));
        navigate('/test-series');
      } finally {
        setInitialLoading(false);
      }
    };

    if (seriesId) {
      fetchSeries();
    }
  }, [seriesId, api, navigate]);

  // Fetch available tests that can be added to the series
  useEffect(() => {
    const fetchAvailableTests = async () => {
      try {
        const response = await api.get('/api/tests', { 
          params: { 
            status: 'published',
            limit: 100
          } 
        });
        
        if (response.data && response.data.tests) {
          // Filter out tests that are already in the series
          const testsInSeries = seriesData.testsIncluded.map(test => test._id);
          const filteredTests = response.data.tests.filter(test => !testsInSeries.includes(test._id));
          setAvailableTests(filteredTests);
        }
      } catch (error) {
        console.error('Error fetching available tests:', error);
      }
    };

    fetchAvailableTests();
  }, [api, seriesData.testsIncluded]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSeriesData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleIsPaidChange = (e) => {
    const isPaid = e.target.checked;
    setSeriesData(prev => ({
      ...prev,
      isPaid,
      // Reset price and discount to 0 if switching to free
      price: isPaid ? prev.price : 0,
      discount: isPaid ? prev.discount : 0
    }));
  };

  const handleOpenAddTestsDialog = () => {
    setSelectedTests([]);
    setShowAddTestsDialog(true);
  };

  const handleCloseAddTestsDialog = () => {
    setShowAddTestsDialog(false);
  };

  const handleTestSelection = (test) => {
    setSelectedTests(prev => {
      const isSelected = prev.some(t => t._id === test._id);
      if (isSelected) {
        return prev.filter(t => t._id !== test._id);
      } else {
        return [...prev, test];
      }
    });
  };

  const handleAddSelectedTests = () => {
    if (selectedTests.length === 0) {
      toast.info('No tests selected');
      return;
    }

    // Add tests to the series with order numbers
    const currentTests = [...seriesData.testsIncluded];
    const highestOrder = currentTests.length > 0 
      ? Math.max(...currentTests.map(test => test.order || 0))
      : -1;
    
    const testsToAdd = selectedTests.map((test, index) => ({
      ...test,
      order: highestOrder + 1 + index
    }));
    
    setSeriesData(prev => ({
      ...prev,
      testsIncluded: [...prev.testsIncluded, ...testsToAdd]
    }));
    
    setShowAddTestsDialog(false);
    toast.success(`Added ${testsToAdd.length} tests to the series`);
  };

  const handleRemoveTest = (testId) => {
    setSeriesData(prev => ({
      ...prev,
      testsIncluded: prev.testsIncluded.filter(test => test._id !== testId)
    }));
  };

  const handleMoveTest = (testIndex, direction) => {
    if (
      (direction === 'up' && testIndex === 0) ||
      (direction === 'down' && testIndex === seriesData.testsIncluded.length - 1)
    ) {
      return;
    }

    const newTests = [...seriesData.testsIncluded];
    const swapIndex = direction === 'up' ? testIndex - 1 : testIndex + 1;
    
    // Swap tests
    [newTests[testIndex], newTests[swapIndex]] = [newTests[swapIndex], newTests[testIndex]];
    
    // Update order values
    newTests.forEach((test, index) => {
      test.order = index;
    });
    
    setSeriesData(prev => ({
      ...prev,
      testsIncluded: newTests
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');

      // Validate series data
      if (!seriesData.title) {
        throw new Error('Title is required');
      }

      if (!seriesData.category) {
        throw new Error('Please select a category');
      }

      // Validate paid series data
      if (seriesData.isPaid && (!seriesData.price || seriesData.price <= 0)) {
        throw new Error('Please enter a valid price for paid series');
      }

      // Warn about empty test series but don't prevent saving
      if (seriesData.testsIncluded.length === 0) {
        // Show a warning toast but continue with the save
        toast('You are saving a test series without any tests. Tests can be added later.', {
          icon: '⚠️',
          style: {
            borderRadius: '10px',
            background: '#FFF3CD',
            color: '#856404',
          },
        });
      }

      // Prepare data for submission
      const dataToSave = {
        ...seriesData,
        // Map testsIncluded to tests as expected by the backend API
        tests: seriesData.testsIncluded.map(test => ({
          _id: test._id,
          order: test.order || 0
        }))
      };

      // Remove testsIncluded since we've mapped it to tests
      delete dataToSave.testsIncluded;

      let response;
      
      if (isEditMode) {
        // Update existing series
        response = await api.put(`/api/test-series/${seriesId}`, dataToSave);
        toast.success('Test series updated successfully');
      } else {
        // Create new series
        response = await api.post('/api/test-series', dataToSave);
        toast.success('Test series created successfully');
      }

      navigate('/test-series');
    } catch (error) {
      console.error('Error saving test series:', error);
      toast.error('Error saving test series: ' + (error.response?.data?.message || error.message));
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
              Loading test series data...
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h5" gutterBottom>
                {isEditMode ? 'Edit Test Series' : 'Create New Test Series'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Create a comprehensive test series by grouping related tests together.
              </Typography>
              <Divider sx={{ mb: 3 }} />
            </Grid>

            {/* Basic Information */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Series Title"
                name="title"
                value={seriesData.title}
                onChange={handleInputChange}
                required
                margin="normal"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Subject"
                name="subject"
                value={seriesData.subject}
                onChange={handleInputChange}
                margin="normal"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Category</InputLabel>
                <Select
                  value={seriesData.category}
                  name="category"
                  onChange={handleInputChange}
                  label="Category"
                  required
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
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Cover Image URL"
                name="coverImage"
                value={seriesData.coverImage}
                onChange={handleInputChange}
                margin="normal"
                placeholder="https://example.com/image.jpg"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={seriesData.description}
                onChange={handleInputChange}
                multiline
                rows={3}
                margin="normal"
              />
            </Grid>

            {/* Pricing Section */}
            <Grid item xs={12}>
              <Box sx={{ mt: 3, mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Pricing & Access
                </Typography>
                <Divider />
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={seriesData.isPaid}
                    onChange={handleIsPaidChange}
                    name="isPaid"
                    color="primary"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography>Paid Series</Typography>
                    <Tooltip title="If enabled, students need to purchase this series to access all included tests">
                      <IconButton size="small">
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
              />
            </Grid>

            {seriesData.isPaid && (
              <>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Price (₹)"
                    name="price"
                    type="number"
                    value={seriesData.price}
                    onChange={handleInputChange}
                    margin="normal"
                    inputProps={{ min: 1 }}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Discount (%)"
                    name="discount"
                    type="number"
                    value={seriesData.discount}
                    onChange={handleInputChange}
                    margin="normal"
                    inputProps={{ min: 0, max: 100 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Access Duration</InputLabel>
                    <Select
                      value={seriesData.accessDuration}
                      name="accessDuration"
                      onChange={handleInputChange}
                      label="Access Duration"
                    >
                      {durationOptions.map(option => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}

            {/* Tests Section */}
            <Grid item xs={12}>
              <Box sx={{ mt: 3, mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Tests in This Series
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Add tests to be included in this series. Students will access them in the order shown.
                  </Typography>
                  <Button
                    startIcon={<AddIcon />}
                    onClick={handleOpenAddTestsDialog}
                    variant="outlined"
                  >
                    Add Tests
                  </Button>
                </Box>
              </Box>

              {seriesData.testsIncluded.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'background.default' }}>
                  <Typography color="text.secondary">
                    No tests added yet. Click "Add Tests" to include tests in this series.
                  </Typography>
                </Paper>
              ) : (
                <TableContainer component={Paper} sx={{ mb: 4 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell width="5%">Order</TableCell>
                        <TableCell width="40%">Test Name</TableCell>
                        <TableCell width="15%">Duration</TableCell>
                        <TableCell width="15%">Questions</TableCell>
                        <TableCell width="25%">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {seriesData.testsIncluded
                        .sort((a, b) => (a.order || 0) - (b.order || 0))
                        .map((test, index) => (
                          <TableRow key={test._id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>
                              <Typography variant="body1">{test.title}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {test.subject}
                              </Typography>
                            </TableCell>
                            <TableCell>{test.duration} mins</TableCell>
                            <TableCell>{test.totalQuestions || 'N/A'}</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <IconButton 
                                  size="small" 
                                  disabled={index === 0}
                                  onClick={() => handleMoveTest(index, 'up')}
                                >
                                  <ArrowUpIcon />
                                </IconButton>
                                <IconButton 
                                  size="small" 
                                  disabled={index === seriesData.testsIncluded.length - 1}
                                  onClick={() => handleMoveTest(index, 'down')}
                                >
                                  <ArrowDownIcon />
                                </IconButton>
                                <IconButton 
                                  size="small" 
                                  color="error"
                                  onClick={() => handleRemoveTest(test._id)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Grid>

            {/* Submit Button */}
            <Grid item xs={12}>
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/test-series')}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => navigate('/test-series')}
                  >
                    View All Series
                  </Button>
                </Box>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={loading}
                  startIcon={loading && <CircularProgress size={20} color="inherit" />}
                >
                  {isEditMode ? 'Update Series' : 'Create Series'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        )}

        {/* Add Tests Dialog */}
        <Dialog 
          open={showAddTestsDialog} 
          onClose={handleCloseAddTestsDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Add Tests to Series</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select tests to add to this series. You can select multiple tests.
            </Typography>
            
            {availableTests.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                No available tests found. Create some tests first.
              </Typography>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell width="5%"></TableCell>
                      <TableCell width="45%">Test Name</TableCell>
                      <TableCell width="20%">Subject</TableCell>
                      <TableCell width="15%">Duration</TableCell>
                      <TableCell width="15%">Questions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {availableTests.map(test => (
                      <TableRow 
                        key={test._id}
                        onClick={() => handleTestSelection(test)}
                        sx={{ 
                          cursor: 'pointer',
                          bgcolor: selectedTests.some(t => t._id === test._id) 
                            ? 'action.selected' 
                            : 'inherit',
                          '&:hover': {
                            bgcolor: 'action.hover',
                          }
                        }}
                      >
                        <TableCell padding="checkbox">
                          <Switch
                            checked={selectedTests.some(t => t._id === test._id)}
                            onChange={() => handleTestSelection(test)}
                            color="primary"
                          />
                        </TableCell>
                        <TableCell>{test.title}</TableCell>
                        <TableCell>{test.subject}</TableCell>
                        <TableCell>{test.duration} mins</TableCell>
                        <TableCell>{test.totalQuestions || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAddTestsDialog}>Cancel</Button>
            <Button 
              onClick={handleAddSelectedTests}
              variant="contained"
              disabled={selectedTests.length === 0}
            >
              Add {selectedTests.length} Test{selectedTests.length !== 1 ? 's' : ''}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
};

export default TestSeriesForm; 