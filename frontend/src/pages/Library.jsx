import React from 'react';
import { Box, Typography, Container, Paper, Divider } from '@mui/material';
import { Book as BookIcon, MenuBook as MenuBookIcon } from '@mui/icons-material';
import Library from '../components/library/Library';
import { useTheme } from '@mui/material/styles';

const LibraryPage = () => {
  const theme = useTheme();
  
  return (
    <Container maxWidth="xl">
      <Box 
        sx={{ 
          mt: { xs: 2, md: 3 }, 
          mb: { xs: 3, md: 5 },
          position: 'relative'
        }}
      >
        {/* Background decoration */}
        <Box 
          sx={{
            position: 'absolute',
            top: -80,
            right: -100,
            width: 200,
            height: 200,
            background: `radial-gradient(circle, ${theme.palette.primary.main}20 0%, transparent 70%)`,
            borderRadius: '50%',
            filter: 'blur(40px)',
            zIndex: -1,
            opacity: 0.6
          }}
        />
        
        <Box 
          sx={{
            position: 'absolute',
            bottom: -60,
            left: -80,
            width: 150,
            height: 150,
            background: `radial-gradient(circle, ${theme.palette.secondary.main}30 0%, transparent 70%)`,
            borderRadius: '50%',
            filter: 'blur(40px)',
            zIndex: -1,
            opacity: 0.5
          }}
        />
        
        <Paper 
          elevation={0}
          sx={{ 
            p: { xs: 3, md: 4 }, 
            borderRadius: 4,
            background: theme => `linear-gradient(120deg, 
              ${theme.palette.mode === 'dark' ? 'rgba(41, 51, 85, 0.7)' : 'rgba(230, 242, 255, 0.7)'} 0%, 
              ${theme.palette.mode === 'dark' ? 'rgba(25, 33, 57, 0.5)' : 'rgba(243, 250, 255, 0.5)'} 100%)`,
            backdropFilter: 'blur(10px)',
            border: '1px solid',
            borderColor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(66,133,244,0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Decorative book icons */}
          <Box sx={{ position: 'absolute', top: -20, right: -20, opacity: 0.07, transform: 'rotate(15deg)' }}>
            <MenuBookIcon sx={{ fontSize: 120 }} />
          </Box>
          
          <Box sx={{ position: 'absolute', bottom: -30, left: 20, opacity: 0.05, transform: 'rotate(-15deg)' }}>
            <BookIcon sx={{ fontSize: 100 }} />
          </Box>
          
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography 
              variant="h3" 
              component="h1" 
              gutterBottom
              sx={{ 
                fontWeight: 700,
                background: theme => `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '0.02em',
                mb: 1,
                textShadow: theme => theme.palette.mode === 'dark' ? '0 0 25px rgba(32, 167, 255, 0.2)' : 'none'
              }}
            >
              Digital Library
            </Typography>
            
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'text.secondary',
                maxWidth: 700,
                mb: 3,
                fontWeight: 400
              }}
            >
              Access millions of books from the Library Genesis database
            </Typography>
            
            <Divider sx={{ mb: 3, opacity: 0.5 }} />
            
            <Typography 
              variant="body1" 
              color="text.secondary" 
              paragraph
              sx={{ maxWidth: 800 }}
            >
              Search by title, author, year, or language to find textbooks, scientific papers, fiction, and more. 
              Create reading lists, get personalized recommendations, and track your reading progress.
            </Typography>
          </Box>
        </Paper>
      </Box>
      
      <Library />
    </Container>
  );
};

export default LibraryPage; 