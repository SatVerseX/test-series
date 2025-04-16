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

  // Mock data for now - in real implementation, this would come from backend
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockRecommendations = [
        {
          id: 'rec1',
          title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
          author: 'Robert C. Martin',
          year: '2008',
          extension: 'pdf',
          rating: 4.7,
          coverIndex: 0,
          category: 'Programming',
          description: "Even bad code can function. But if code isn't clean, it can bring a development organization to its knees."
        },
        {
          id: 'rec2',
          title: 'Design Patterns: Elements of Reusable Object-Oriented Software',
          author: 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides',
          year: '1994',
          extension: 'epub',
          rating: 4.6,
          coverIndex: 1,
          category: 'Software Architecture',
          description: "Capturing a wealth of experience about the design of object-oriented software."
        },
        {
          id: 'rec3',
          title: 'The Pragmatic Programmer',
          author: 'Andrew Hunt, David Thomas',
          year: '2019',
          extension: 'pdf',
          rating: 4.8,
          coverIndex: 2,
          category: 'Programming',
          description: "Journey to mastery: A guide filled with practical advice, both technical and professional."
        },
        {
          id: 'rec4',
          title: 'Refactoring: Improving the Design of Existing Code',
          author: 'Martin Fowler',
          year: '2018',
          extension: 'pdf',
          rating: 4.5,
          coverIndex: 3,
          category: 'Software Development',
          description: "Learn how to improve your code's design to make it more maintainable."
        },
        {
          id: 'rec5',
          title: 'JavaScript: The Good Parts',
          author: 'Douglas Crockford',
          year: '2008',
          extension: 'epub',
          rating: 4.4,
          coverIndex: 4,
          category: 'Web Development',
          description: "Unearthing the excellent programming language inside JavaScript."
        }
      ];
      
      setRecommendations(mockRecommendations);
      setLoading(false);
    }, 1500);
  }, [userPreferences]);

  const handleSaveBook = (book, event) => {
    event.stopPropagation();
    if (savedBooks.some(savedBook => savedBook.id === book.id)) {
      setSavedBooks(savedBooks.filter(savedBook => savedBook.id !== book.id));
    } else {
      setSavedBooks([...savedBooks, book]);
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
                        image={PLACEHOLDER_COVERS[book.coverIndex]}
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