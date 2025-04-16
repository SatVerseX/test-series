import React, { useState, useEffect } from 'react';
import { Box, Grid, Tab, Tabs, Paper, Typography, CircularProgress, Alert, Divider, Fade } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import RecommendIcon from '@mui/icons-material/Recommend';
import SearchForm from './SearchForm.jsx';
import BookList from './BookList.jsx';
import RecommendedBooks from './RecommendedBooks.jsx';
import ReadingList from './ReadingList.jsx';
import axios from 'axios';
import api from '../../config/api';

const Library = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [userPreferences, setUserPreferences] = useState({
    recentSearches: [],
    favoriteAuthors: [],
    favoriteGenres: ['Programming', 'Computer Science']
  });

  // Define API base URL with fallback options
  const getApiBaseUrl = () => {
    // Try development proxy first (relative path)
    return '/api';
  };

  const handleSearch = async (searchParams) => {
    setLoading(true);
    setError('');
    setBooks([]);
    
    try {
      console.log('Search params:', searchParams);
      
      // Validate search parameters
      if (!searchParams.title && !searchParams.author) {
        setError('Please enter either a title or author name');
        setLoading(false);
        return;
      }
      
      // Construct query parameters
      const params = new URLSearchParams();
      if (searchParams.title) params.append('title', searchParams.title);
      if (searchParams.author) params.append('author', searchParams.author);
      if (searchParams.year) params.append('year', searchParams.year);
      if (searchParams.language) params.append('language', searchParams.language);
      if (searchParams.extension) params.append('extension', searchParams.extension);
      
      const apiUrl = getApiBaseUrl();
      console.log('Making API request using URL base:', apiUrl);
      
      // Make API request with explicit configuration
      const response = await axios({
        method: 'get',
        url: `${apiUrl}/library/search?${params.toString()}`,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });
      
      console.log('Search API response:', response);
      
      if (response.data.success) {
        console.log('Search successful, found books:', response.data.data?.length || 0);
        const fetchedBooks = response.data.data || [];
        
        // Log mirror links for the first few books for debugging
        fetchedBooks.slice(0, 3).forEach((book, index) => {
          console.log(`Book ${index+1} mirror links:`, {
            Mirror_1: book.Mirror_1,
            Mirror_2: book.Mirror_2,
            Mirror_3: book.Mirror_3,
            original_mirrors: book.original_mirrors
          });
        });
        
        setBooks(fetchedBooks);
        
        // Save search to recent searches
        if (searchParams.title || searchParams.author) {
          const searchQuery = {
            id: Date.now(),
            query: searchParams.title || searchParams.author,
            timestamp: new Date().toISOString(),
            params: searchParams
          };
          
          setUserPreferences(prev => ({
            ...prev,
            recentSearches: [searchQuery, ...prev.recentSearches].slice(0, 5)
          }));
        }
      } else {
        console.error('API returned error:', response.data);
        setError(response.data.message || 'An error occurred during search');
      }
    } catch (err) {
      console.error('Search error:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response ? {
          status: err.response.status,
          data: err.response.data
        } : 'No response',
        request: err.request ? 'Request was made but no response received' : 'No request'
      });
      
      setError(err.response?.data?.message || err.message || 'Failed to search books. Please check if the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleGetDownloadLinks = async (book) => {
    try {
      console.log('Requesting download links for book:', book);
      
      // Use the specialized API function for getting download links
      return await api.getDownloadLinks(book);
      
    } catch (err) {
      // Provide more detailed error logging
      console.error('Error getting download links:', err);
      
      // Throw a user-friendly error
      throw new Error('Could not retrieve download links. The service might be unavailable.');
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSelectRecommendedBook = (book) => {
    // This would be expanded to fetch the full book details
    // For now, just show it in the console
    console.log('Selected recommended book:', book);
  };

  const TabPanel = ({ children, value, index, ...other }) => {
    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`library-tabpanel-${index}`}
        aria-labelledby={`library-tab-${index}`}
        {...other}
      >
        {value === index && (
          <Box sx={{ pt: 3 }}>
            {children}
          </Box>
        )}
      </div>
    );
  };

  const a11yProps = (index) => {
    return {
      id: `library-tab-${index}`,
      'aria-controls': `library-tabpanel-${index}`,
    };
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper 
        elevation={0} 
        sx={{ 
          borderRadius: 3,
          overflow: 'hidden',
          mb: 3,
          borderColor: 'divider',
          borderWidth: 1,
          borderStyle: 'solid'
        }}
      >
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
          sx={{
            '& .MuiTab-root': {
              py: 2,
              fontWeight: 500,
            }
          }}
        >
          <Tab 
            icon={<SearchIcon />} 
            label="Search" 
            {...a11yProps(0)}
          />
          <Tab 
            icon={<RecommendIcon />} 
            label="Recommended" 
            {...a11yProps(1)}
          />
          <Tab 
            icon={<BookmarkIcon />} 
            label="Reading Lists" 
            {...a11yProps(2)}
          />
        </Tabs>
      </Paper>

      <TabPanel value={tabValue} index={0}>
        <SearchForm onSearch={handleSearch} isLoading={loading} />
        
        {error && (
          <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>
            {error}
          </Alert>
        )}
        
        <BookList 
          books={books} 
          loading={loading}
          onGetDownloadLinks={handleGetDownloadLinks}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <RecommendedBooks 
          onSelectBook={handleSelectRecommendedBook}
          userPreferences={userPreferences}
        />
      </TabPanel>
      
      <TabPanel value={tabValue} index={2}>
        <ReadingList />
      </TabPanel>
    </Box>
  );
};

export default Library; 