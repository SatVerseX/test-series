import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  Typography,
  IconButton,
  InputAdornment,
  Chip,
  Stack
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SortIcon from '@mui/icons-material/Sort';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../config/api';

const TestSearch = ({ onSearch }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    difficulty: 'all',
    category: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [availableFilters, setAvailableFilters] = useState({
    categories: [],
    difficulties: []
  });

  useEffect(() => {
    // Get filters from URL params
    const params = new URLSearchParams(location.search);
    const search = params.get('search') || '';
    setSearchTerm(search);
    setFilters({
      status: params.get('status') || 'all',
      difficulty: params.get('difficulty') || 'all',
      category: params.get('category') || 'all',
      sortBy: params.get('sortBy') || 'createdAt',
      sortOrder: params.get('sortOrder') || 'desc'
    });

    // Fetch available filters
    fetchAvailableFilters();
  }, [location]);

  const fetchAvailableFilters = async () => {
    try {
      const response = await api.get('/tests/filters');
      setAvailableFilters({
        categories: response.data.categories || [],
        difficulties: response.data.difficulties || []
      });
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    updateURL({ search: value });
    onSearch({ ...filters, search: value });
  };

  const handleFilterChange = (filter, value) => {
    const newFilters = { ...filters, [filter]: value };
    setFilters(newFilters);
    updateURL({ [filter]: value });
    onSearch({ ...newFilters, search: searchTerm });
  };

  const updateURL = (newParams) => {
    const params = new URLSearchParams(location.search);
    
    // Update params
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === 'all' || !value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    // Update URL without page refresh
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      status: 'all',
      difficulty: 'all',
      category: 'all',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    navigate(location.pathname);
    onSearch({
      search: '',
      status: 'all',
      difficulty: 'all',
      category: 'all',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Grid container spacing={2} alignItems="center">
        {/* Search Bar */}
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search tests..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Filters */}
        <Grid item xs={12} md={8}>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="published">Published</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Difficulty</InputLabel>
              <Select
                value={filters.difficulty}
                label="Difficulty"
                onChange={(e) => handleFilterChange('difficulty', e.target.value)}
              >
                <MenuItem value="all">All Levels</MenuItem>
                {availableFilters.difficulties.map((level) => (
                  <MenuItem key={level} value={level}>
                    {level}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={filters.category}
                label="Category"
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <MenuItem value="all">All Categories</MenuItem>
                {availableFilters.categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={filters.sortBy}
                label="Sort By"
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              >
                <MenuItem value="createdAt">Date</MenuItem>
                <MenuItem value="title">Title</MenuItem>
                <MenuItem value="difficulty">Difficulty</MenuItem>
              </Select>
            </FormControl>

            <IconButton
              onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
              color="primary"
            >
              <SortIcon style={{ 
                transform: filters.sortOrder === 'asc' ? 'rotate(180deg)' : 'none' 
              }} />
            </IconButton>

            <Chip
              label="Clear Filters"
              onClick={clearFilters}
              color="default"
              variant="outlined"
              sx={{ ml: 1 }}
            />
          </Stack>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default TestSearch; 