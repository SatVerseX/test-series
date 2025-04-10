import React, { useEffect, useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Typography,
  Box,
  Stack,
  CircularProgress,
  InputAdornment
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { toast } from "react-toastify";
import debounce from "lodash.debounce";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const TestList = () => {
  const [tests, setTests] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: "all",
    search: "",
    difficulty: "all",
    category: "all",
    sortBy: "createdAt",
    sortOrder: "desc"
  });
  const [currentPage, setCurrentPage] = useState(1);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { user, api } = useAuth();

  // Initialize filters from URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get('status') || 'all';
    const search = params.get('search') || '';
    const page = parseInt(params.get('page')) || 1;
    
    setFilters(prev => ({
      ...prev,
      status,
      search
    }));
    
    setCurrentPage(page);
    setSearchTerm(search);
    
    // Fetch tests with initial filters
    fetchTests(page, {
      ...filters,
      status,
      search
    });
  }, []);

  const fetchTests = async (newPage = 1, currentFilters = filters) => {
    try {
      setLoading(true);
      console.log('Fetching tests with filters:', currentFilters);
      
      if (!api) {
        throw new Error('API instance is not defined');
      }
      
      // Build query parameters
      const params = new URLSearchParams();
      params.set('page', newPage);
      params.set('limit', 5);
      
      // Add filters to params
      if (currentFilters.status && currentFilters.status !== 'all') {
        params.set('status', currentFilters.status);
        console.log(`Setting status filter: ${currentFilters.status}`);
      }
      
      if (currentFilters.search) {
        params.set('search', currentFilters.search);
      }
      
      if (currentFilters.difficulty && currentFilters.difficulty !== 'all') {
        params.set('difficulty', currentFilters.difficulty);
      }
      
      if (currentFilters.category && currentFilters.category !== 'all') {
        params.set('category', currentFilters.category);
      }
      
      if (currentFilters.sortBy) {
        params.set('sortBy', currentFilters.sortBy);
      }
      
      if (currentFilters.sortOrder) {
        params.set('sortOrder', currentFilters.sortOrder);
      }
      
      console.log('Request params:', params.toString());
      
      const response = await api.get(`/api/tests?${params.toString()}`);
      console.log('API response:', response);
      
      setTests(response.data.tests || []);
      setTotalPages(response.data.totalPages || 1);
      setCurrentPage(newPage);
    } catch (error) {
      console.error("Error fetching tests:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      if (error.response?.status === 401) {
        toast.error("Authentication error. Please log in again.");
        navigate('/login');
      } else {
        toast.error("Failed to fetch tests");
      }
      
      setTests([]);
    } finally {
      setLoading(false);
    }
  };

  // Advanced filter handling with multiple filter types
  const handleFilterChange = (filterType, value) => {
    try {
      console.log(`Filter change requested: ${filterType} = ${value}`);
      
      // Update the specific filter in state
      setFilters(prevFilters => {
        const newFilters = { ...prevFilters, [filterType]: value };
        
        // Log filter changes for debugging
        console.log(`Filter changed: ${filterType} = ${value}`);
        console.log('Updated filters:', newFilters);
        
        // Special handling for certain filter types
        if (filterType === 'status') {
          // Reset page when status changes to ensure proper pagination
          setCurrentPage(1);
        }
        
        // Update URL params to reflect filter changes
        updateURLParams(newFilters);
        
        return newFilters;
      });
      
      // Apply filter immediately instead of using debounce
      setLoading(true);
      fetchTests(1, { ...filters, [filterType]: value });
    } catch (error) {
      console.error('Error applying filter:', error);
      setError('Failed to apply filter. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Advanced search with debounce, validation, and error handling
  const handleSearchChange = (event) => {
    try {
      const searchValue = event.target.value;
      
      // Input validation
      if (searchValue.length > 100) {
        setError('Search query is too long. Please limit to 100 characters.');
        return;
      }
      
      // Update search term in state
      setSearchTerm(searchValue);
      
      // Update filters with search term
      setFilters(prevFilters => ({
        ...prevFilters,
        search: searchValue
      }));
      
      // Update URL params
      const params = new URLSearchParams(location.search);
      if (searchValue) {
        params.set('search', searchValue);
      } else {
        params.delete('search');
      }
      params.set('page', '1'); // Reset to first page on new search
      navigate(`${location.pathname}?${params.toString()}`);
      
      // Apply search with debounce
      debouncedSearch(searchValue);
    } catch (error) {
      console.error('Error handling search:', error);
      setError('Failed to process search. Please try again.');
    }
  };

  // Debounced search function
  const debouncedSearch = useMemo(
    () => debounce((value) => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch results with new search term
        fetchTests(1, { ...filters, search: value });
      } catch (error) {
        console.error('Error in debounced search:', error);
        setError('Search failed. Please try again.');
      } finally {
        setLoading(false);
      }
    }, 500),
    [filters]
  );

  // Debounced filter application
  const debouncedApplyFilters = useMemo(
    () => debounce(() => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch results with current filters
        fetchTests(1, filters);
      } catch (error) {
        console.error('Error applying filters:', error);
        setError('Failed to apply filters. Please try again.');
      } finally {
        setLoading(false);
      }
    }, 300),
    [filters]
  );

  // Helper function to update URL parameters
  const updateURLParams = (currentFilters) => {
    try {
      const params = new URLSearchParams();
      
      // Add all non-empty filters to URL
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          params.set(key, value);
        }
      });
      
      // Always include page parameter
      params.set('page', '1');
      
      // Update URL without page refresh
      navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    } catch (error) {
      console.error('Error updating URL params:', error);
    }
  };

  const handleToggleStatus = async (testId) => {
    try {
      const response = await api.put(`/api/tests/${testId}/status`);
      setTests((prevTests) =>
        prevTests.map((test) =>
          test._id === testId ? { ...test, status: response.data.status } : test
        )
      );
      toast.success(`Test marked as ${response.data.status}`);
    } catch (error) {
      toast.error("Failed to update test status");
    }
  };

  const handleCreateTest = () => {
    navigate('/test/create');
  };

  return (
    <Paper 
      sx={{ 
        width: "100%", 
        overflow: "hidden", 
        p: 3,
        borderRadius: 2,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}
    >
      <Stack spacing={3}>
        {/* Header Section */}
        <Stack 
          direction="row" 
          justifyContent="space-between" 
          alignItems="center"
          sx={{ 
            borderBottom: '2px solid',
            borderColor: 'primary.main',
            pb: 2
          }}
        >
          <Typography 
            variant="h4" 
            component="h1"
            sx={{ 
              fontWeight: 600,
              color: 'primary.main'
            }}
          >
            Tests
          </Typography>
          {user && user.role === 'admin' && (
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleCreateTest}
              startIcon={<AddIcon />}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                px: 3,
                py: 1
              }}
            >
              Create Test
            </Button>
          )}
        </Stack>

        {/* Search and Filters Section */}
        <Stack 
          direction={{ xs: 'column', md: 'row' }} 
          spacing={2}
          sx={{ 
            bgcolor: 'background.paper',
            p: 2,
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}
        >
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search Tests..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2
              }
            }}
          />
          <FormControl 
            sx={{ 
              minWidth: { xs: '100%', md: 200 },
              '& .MuiOutlinedInput-root': {
                borderRadius: 2
              }
            }}
          >
            <InputLabel>Status</InputLabel>
            <Select 
              value={filters.status} 
              onChange={(event) => handleFilterChange('status', event.target.value)}
              label="Status"
            >
              <MenuItem value="all">All Tests</MenuItem>
              <MenuItem value="published">Published</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        
        {/* Table Section */}
        <TableContainer 
          sx={{ 
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            '& .MuiTableCell-root': {
              py: 2
            }
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Title</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : tests && tests.length > 0 ? (
                tests.map((test) => (
                  <TableRow 
                    key={test._id}
                    hover
                    sx={{ 
                      '&:last-child td, &:last-child th': { border: 0 },
                      transition: 'background-color 0.2s',
                      '&:hover': {
                        bgcolor: 'action.hover'
                      }
                    }}
                  >
                    <TableCell>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {test.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={test.status}
                        color={test.status === "published" ? "success" : "default"}
                        sx={{ 
                          borderRadius: 1,
                          textTransform: 'capitalize'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        {user && user.role === 'admin' && (
                          <Button
                            variant="contained"
                            color={test.status === "draft" ? "primary" : "secondary"}
                            onClick={() => handleToggleStatus(test._id)}
                            size="small"
                            sx={{ 
                              borderRadius: 1,
                              textTransform: 'none'
                            }}
                          >
                            {test.status === "draft" ? "Publish" : "Unpublish"}
                          </Button>
                        )}
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={() => navigate(`/test/${test._id}`)}
                          size="small"
                          sx={{ 
                            borderRadius: 1,
                            textTransform: 'none'
                          }}
                        >
                          {user && user.role === 'admin' ? "Edit" : "Take Test"}
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No tests found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination Section */}
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center"
          sx={{ 
            mt: 2,
            gap: 2
          }}
        >
          <Button 
            variant="outlined"
            disabled={currentPage === 1} 
            onClick={() => fetchTests(currentPage - 1)}
            startIcon={<ChevronLeftIcon />}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none'
            }}
          >
            Previous
          </Button>
          <Typography 
            variant="body1" 
            sx={{ 
              px: 2,
              py: 1,
              bgcolor: 'background.paper',
              borderRadius: 2,
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}
          >
            Page {currentPage} of {totalPages}
          </Typography>
          <Button 
            variant="outlined"
            disabled={currentPage === totalPages} 
            onClick={() => fetchTests(currentPage + 1)}
            endIcon={<ChevronRightIcon />}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none'
            }}
          >
            Next
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
};

export default TestList;