import React, { useState } from 'react';
import { 
  Paper, 
  TextField, 
  Button, 
  Grid, 
  Typography, 
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Divider,
  InputAdornment,
  Chip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import TranslateIcon from '@mui/icons-material/Translate';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

const SearchForm = ({ onSearch, isLoading }) => {
  const [searchParams, setSearchParams] = useState({
    title: '',
    author: '',
    year: '',
    language: '',
    extension: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!searchParams.title && !searchParams.author) {
      alert('Please enter either a title or author name');
      return;
    }
    onSearch(searchParams);
  };

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 4, 
        mb: 4, 
        borderRadius: 3,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 24px rgba(0,0,0,0.06)'
        }
      }}
    >
      <Typography 
        variant="h5" 
        component="h2" 
        gutterBottom 
        sx={{ 
          mb: 3, 
          fontWeight: 600,
          position: 'relative'
        }}
      >
        Search Parameters
        <Box 
          sx={{ 
            position: 'absolute', 
            bottom: -8, 
            left: 0, 
            width: 40, 
            height: 3, 
            bgcolor: 'primary.main',
            borderRadius: 1 
          }} 
        />
      </Typography>
      
      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              name="title"
              label="Book Title"
              variant="outlined"
              fullWidth
              value={searchParams.title}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MenuBookIcon color="primary" />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: 'primary.light',
                  },
                  '&.Mui-focused fieldset': {
                    borderWidth: '1px',
                  },
                },
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              name="author"
              label="Author"
              variant="outlined"
              fullWidth
              value={searchParams.author}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="primary" />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: 'primary.light',
                  },
                  '&.Mui-focused fieldset': {
                    borderWidth: '1px',
                  },
                },
              }}
            />
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 4, mb: 3 }}>
          <Divider>
            <Chip 
              label="Optional Filters" 
              variant="outlined" 
              sx={{ 
                px: 1,
                fontWeight: 500,
                bgcolor: 'background.default'
              }} 
            />
          </Divider>
        </Box>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <TextField
              name="year"
              label="Publication Year"
              variant="outlined"
              fullWidth
              value={searchParams.year}
              onChange={handleChange}
              placeholder="e.g. 2022"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarTodayIcon color="primary" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel id="language-label">Language</InputLabel>
              <Select
                labelId="language-label"
                name="language"
                value={searchParams.language}
                label="Language"
                onChange={handleChange}
                startAdornment={
                  <InputAdornment position="start">
                    <TranslateIcon color="primary" />
                  </InputAdornment>
                }
              >
                <MenuItem value=""><em>Any Language</em></MenuItem>
                <MenuItem value="English">English</MenuItem>
                <MenuItem value="Russian">Russian</MenuItem>
                <MenuItem value="German">German</MenuItem>
                <MenuItem value="French">French</MenuItem>
                <MenuItem value="Spanish">Spanish</MenuItem>
                <MenuItem value="Chinese">Chinese</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel id="extension-label">File Format</InputLabel>
              <Select
                labelId="extension-label"
                name="extension"
                value={searchParams.extension}
                label="File Format"
                onChange={handleChange}
                startAdornment={
                  <InputAdornment position="start">
                    <InsertDriveFileIcon color="primary" />
                  </InputAdornment>
                }
              >
                <MenuItem value=""><em>Any Format</em></MenuItem>
                <MenuItem value="pdf">PDF</MenuItem>
                <MenuItem value="epub">EPUB</MenuItem>
                <MenuItem value="mobi">MOBI</MenuItem>
                <MenuItem value="djvu">DJVU</MenuItem>
                <MenuItem value="azw">AZW</MenuItem>
                <MenuItem value="azw3">AZW3</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              size="large" 
              disabled={isLoading}
              fullWidth
              sx={{ 
                mt: 2,
                py: 1.5,
                fontWeight: 600,
                fontSize: '1rem',
                position: 'relative',
                overflow: 'hidden',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(120deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 70%)',
                  transform: 'translateX(-100%)',
                },
                '&:hover::after': {
                  transition: 'transform 0.7s ease-in-out',
                  transform: 'translateX(100%)'
                }
              }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                <>
                  <SearchIcon sx={{ mr: 1 }} />
                  Search Library Genesis
                </>
              )}
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default SearchForm; 