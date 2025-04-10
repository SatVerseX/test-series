import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Pagination,
  Stack
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import TestCard from '../../components/tests/TestCard';
import TestSearch from '../../components/tests/TestSearch';
import api from '../../config/api';

const Tests = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTests, setTotalTests] = useState(0);

  useEffect(() => {
    // Get initial filters from URL params
    const params = new URLSearchParams(location.search);
    const page = parseInt(params.get('page')) || 1;
    setCurrentPage(page);
    fetchTests(page);
  }, [location]);

  const fetchTests = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams(location.search);
      params.set('page', page);
      params.set('limit', 9);

      const response = await api.get(`/tests?${params.toString()}`);
      
      if (response.data && Array.isArray(response.data.tests)) {
        setTests(response.data.tests);
        setTotalTests(response.data.total || 0);
        setTotalPages(Math.ceil((response.data.total || 0) / 9));
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
      setError(error.response?.data?.message || 'Failed to fetch tests. Please try again later.');
      setTests([]);
      setTotalPages(1);
      setTotalTests(0);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (event, value) => {
    const params = new URLSearchParams(location.search);
    params.set('page', value);
    navigate(`${location.pathname}?${params.toString()}`);
  };

  const handleSearch = (filters) => {
    const params = new URLSearchParams();
    
    // Add filters to URL params
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        params.set(key, value);
      }
    });

    // Reset to first page when applying new filters
    params.set('page', 1);
    
    navigate(`${location.pathname}?${params.toString()}`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Available Tests
      </Typography>

      <TestSearch onSearch={handleSearch} />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {tests.length === 0 ? (
        <Alert severity="info">
          No tests found matching your criteria. Try adjusting your filters.
        </Alert>
      ) : (
        <>
          <Grid container spacing={3}>
            {tests.map((test) => (
              <Grid item xs={12} sm={6} md={4} key={test._id}>
                <TestCard test={test} />
              </Grid>
            ))}
          </Grid>

          {totalPages > 1 && (
            <Stack spacing={2} alignItems="center" sx={{ mt: 4 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                size="large"
              />
            </Stack>
          )}
        </>
      )}
    </Container>
  );
};

export default Tests; 