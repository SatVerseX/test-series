import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Chip,
  Skeleton,
  Divider,
  IconButton,
  Tooltip,
  Paper,
  CardActionArea
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

const PLACEHOLDER_COVERS = [
  'https://images.unsplash.com/photo-1589998059171-988d887df646?auto=format&fit=crop&w=400&h=600',
  'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&h=600',
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&h=600',
  'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=400&h=600',
  'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=400&h=600',
];

const RecommendedBooks = ({ onSelectBook, userPreferences }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [savedBooks, setSavedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { api } = useAuth();

  // Fetch recommended books from API
  useEffect(() => {
    const fetchRecommendedBooks = async () => {
      try {
        setLoading(true);
        
        // Real API call to get recommended books
        const response = await api.get('/api/books/recommendations', {
          params: {
            preferences: userPreferences
          }
        });
        
        if (response.data && response.data.length > 0) {
          setRecommendations(response.data);
        } else {
          setRecommendations([]);
        }
      } catch (error) {
        console.error('Error fetching recommended books:', error);
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendedBooks();
  }, [api, userPreferences]);

  // Fetch user's saved books
  useEffect(() => {
    const fetchSavedBooks = async () => {
      try {
        const response = await api.get('/api/books/saved');
        if (response.data) {
          setSavedBooks(response.data);
        }
      } catch (error) {
        console.error('Error fetching saved books:', error);
      }
    };

    fetchSavedBooks();
  }, [api]);

  const handleSaveBook = async (book, event) => {
    event.stopPropagation();
    try {
      const isSaved = savedBooks.some(savedBook => savedBook.id === book.id);
      
      if (isSaved) {
        await api.delete(`/api/books/saved/${book.id}`);
        setSavedBooks(savedBooks.filter(savedBook => savedBook.id !== book.id));
      } else {
        await api.post('/api/books/saved', { bookId: book.id });
        setSavedBooks([...savedBooks, book]);
      }
    } catch (error) {
      console.error('Error updating saved books:', error);
    }
  };

  const handleSelectBook = (book) => {
    if (onSelectBook) {
      onSelectBook(book);
    }
  };

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return '#4caf50';
    if (rating >= 4.0) return '#8bc34a';
    if (rating >= 3.5) return '#ffc107';
    return '#ff9800';
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        mb: 4,
        backgroundColor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography
          variant="h5"
          component="h2"
          sx={{
            fontWeight: 600,
            position: 'relative',
            '&:after': {
              content: '""',
              position: 'absolute',
              bottom: -8,
              left: 0,
              width: 40,
              height: 3,
              bgcolor: 'primary.main',
              borderRadius: 1
            }
          }}
        >
          Recommended for You
        </Typography>
        <Button
          endIcon={<ArrowForwardIcon />}
          color="primary"
          sx={{ fontWeight: 500 }}
        >
          View All
        </Button>
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={3}>
        {loading ? (
          // Loading skeletons
          Array.from(new Array(5)).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} lg={2.4} key={`skeleton-${index}`}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Skeleton variant="rectangular" height={200} />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Skeleton variant="text" height={28} width="80%" />
                  <Skeleton variant="text" height={20} width="60%" />
                  <Box sx={{ mt: 2 }}>
                    <Skeleton variant="text" height={24} width="40%" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : recommendations.length === 0 ? (
          <Grid item xs={12}>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No recommended books available at the moment.
              </Typography>
            </Box>
          </Grid>
        ) : (
          recommendations.map((book, index) => (
            <Grid item xs={12} sm={6} md={4} lg={2.4} key={book.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: 6
                    },
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: 2
                  }}
                >
                  <IconButton
                    sx={{
                      position: 'absolute',
                      top: 10,
                      left: 10,
                      bgcolor: 'rgba(255,255,255,0.9)',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,1)'
                      },
                      p: 0.75,
                      zIndex: 1
                    }}
                    onClick={(e) => handleSaveBook(book, e)}
                  >
                    <Tooltip title={savedBooks.some(saved => saved.id === book.id) ? "Remove from saved" : "Save for later"}>
                      {savedBooks.some(saved => saved.id === book.id) ? (
                        <BookmarkIcon fontSize="small" color="primary" />
                      ) : (
                        <BookmarkBorderIcon fontSize="small" />
                      )}
                    </Tooltip>
                  </IconButton>
                  
                  <CardActionArea onClick={() => handleSelectBook(book)}>
                    <Box sx={{ position: 'relative' }}>
                      <CardMedia
                        component="img"
                        height="200"
                        image={book.coverUrl || PLACEHOLDER_COVERS[index % PLACEHOLDER_COVERS.length]}
                        alt={book.title}
                        sx={{ objectFit: 'cover' }}
                      />
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          display: 'flex',
                          alignItems: 'center',
                          bgcolor: 'rgba(0,0,0,0.6)',
                          color: 'white',
                          borderRadius: '12px',
                          px: 1,
                          py: 0.5
                        }}
                      >
                        <StarIcon sx={{ fontSize: 16, color: getRatingColor(book.rating), mr: 0.5 }} />
                        <Typography variant="body2" fontWeight={600}>
                          {book.rating}
                        </Typography>
                      </Box>
                      {book.extension && (
                        <Chip
                          label={book.extension.toUpperCase()}
                          size="small"
                          sx={{
                            position: 'absolute',
                            bottom: 10,
                            left: 10,
                            bgcolor: 'rgba(0,0,0,0.6)',
                            color: 'white',
                            fontWeight: 600,
                            borderRadius: '12px'
                          }}
                        />
                      )}
                    </Box>
                    <CardContent sx={{ flexGrow: 1, pt: 2 }}>
                      <Typography
                        gutterBottom
                        variant="subtitle1"
                        component="div"
                        sx={{
                          fontWeight: 600,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: 1.2,
                          height: '2.4em'
                        }}
                      >
                        {book.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {book.author}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Chip
                          label={book.category}
                          size="small"
                          variant="outlined"
                          sx={{ borderRadius: '6px', fontSize: '0.7rem' }}
                        />
                        {book.year && (
                          <Chip
                            label={book.year}
                            size="small"
                            variant="outlined"
                            sx={{ borderRadius: '6px', ml: 0.5, fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </motion.div>
            </Grid>
          ))
        )}
      </Grid>
    </Paper>
  );
};

export default RecommendedBooks; 