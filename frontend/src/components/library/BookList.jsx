import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Divider,
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
  Avatar,
  Fade
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import GetAppIcon from '@mui/icons-material/GetApp';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import InfoIcon from '@mui/icons-material/Info';

const BookList = ({ books, loading, onGetDownloadLinks }) => {
  const [selectedBook, setSelectedBook] = useState(null);
  const [downloadLinks, setDownloadLinks] = useState(null);
  const [linkLoading, setLinkLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGetLinks = async (book) => {
    setSelectedBook(book);
    setLinkLoading(true);
    setError('');
    try {
      // Add debug logging for mirror links
      console.log('Getting download links for book:', book.Title);
      console.log('Mirror links in book object:', {
        Mirror_1: book.Mirror_1,
        Mirror_2: book.Mirror_2,
        Mirror_3: book.Mirror_3
      });
      
      const links = await onGetDownloadLinks(book);
      console.log('Received download links:', links);
      setDownloadLinks(links);
    } catch (err) {
      setError(err.message || 'Failed to retrieve download links');
      setDownloadLinks(null);
    } finally {
      setLinkLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setSelectedBook(null);
    setDownloadLinks(null);
    setError('');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 8, flexDirection: 'column' }}>
        <CircularProgress size={50} thickness={4} />
        <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary', fontWeight: 500 }}>
          Searching Library Genesis...
        </Typography>
      </Box>
    );
  }

  if (books.length === 0) {
    return null;
  }

  // Debug what fields are available
  console.log("First book sample:", books[0]);

  // Get random pastel colors for book format chips
  const getFormatColor = (format) => {
    const colors = {
      'pdf': { bg: '#fef2f2', color: '#dc2626' },
      'epub': { bg: '#f0fdf4', color: '#16a34a' },
      'mobi': { bg: '#eff6ff', color: '#2563eb' },
      'djvu': { bg: '#fdf4ff', color: '#c026d3' },
      'azw': { bg: '#fff7ed', color: '#ea580c' },
      'azw3': { bg: '#fef3c7', color: '#d97706' },
    };
    
    return colors[format?.toLowerCase()] || { bg: '#f3f4f6', color: '#4b5563' };
  };

  return (
    <Fade in={books.length > 0} timeout={500}>
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 6, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <LibraryBooksIcon color="primary" sx={{ fontSize: 32, mr: 1.5 }} />
            <Typography 
              variant="h5" 
              component="h2" 
              sx={{ 
                fontWeight: 600,
                background: 'linear-gradient(90deg, #2563eb 0%, #4f46e5 100%)',
                backgroundClip: 'text',
                textFillColor: 'transparent',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Search Results
            </Typography>
          </Box>
          <Chip 
            label={`${books.length} books found`} 
            color="primary" 
            variant="filled" 
            sx={{ 
              borderRadius: '16px', 
              fontWeight: 500,
              px: 1
            }} 
          />
        </Box>
        
        <Grid container spacing={3}>
          {books.map((book, index) => (
            <Grid item xs={12} key={index}>
              <Card 
                variant="outlined" 
                sx={{ 
                  borderRadius: 3,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 10px 20px rgba(0,0,0,0.08)'
                  },
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {book.Extension && (
                  <Box 
                    sx={{ 
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: '120px',
                      height: '120px',
                      background: `linear-gradient(135deg, transparent 50%, ${getFormatColor(book.Extension).bg} 50%)`,
                    }}
                  />
                )}
                <CardContent sx={{ p: 3 }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={8}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                        <Avatar 
                          sx={{ 
                            bgcolor: 'primary.main', 
                            width: 48, 
                            height: 48, 
                            mr: 2,
                            display: { xs: 'none', sm: 'flex' } 
                          }}
                        >
                          <MenuBookIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" component="h3" gutterBottom fontWeight={600} sx={{ lineHeight: 1.3 }}>
                            {book.Title || 'Unknown Title'}
                          </Typography>
                          
                          <Typography 
                            variant="subtitle1" 
                            color="text.secondary" 
                            gutterBottom 
                            sx={{ mb: 2 }}
                          >
                            {book.Author || 'Unknown Author'}
                          </Typography>
                          
                          <Divider sx={{ my: 1.5 }} />
                          
                          <Grid container spacing={1} sx={{ mt: 1 }}>
                            {book.Extension && (
                              <Grid item>
                                <Chip 
                                  label={book.Extension.toUpperCase()}
                                  size="small" 
                                  sx={{ 
                                    bgcolor: getFormatColor(book.Extension).bg,
                                    color: getFormatColor(book.Extension).color,
                                    fontWeight: 600,
                                    borderRadius: '6px',
                                  }}
                                />
                              </Grid>
                            )}
                            
                            {book.Year && (
                              <Grid item>
                                <Chip 
                                  label={`${book.Year}`} 
                                  size="small" 
                                  variant="outlined"
                                  sx={{ borderRadius: '6px' }}
                                />
                              </Grid>
                            )}
                            
                            {book.Language && (
                              <Grid item>
                                <Chip 
                                  label={book.Language} 
                                  size="small" 
                                  variant="outlined"
                                  sx={{ borderRadius: '6px' }}
                                />
                              </Grid>
                            )}
                            
                            {book.Size && (
                              <Grid item>
                                <Chip 
                                  label={book.Size} 
                                  size="small" 
                                  variant="outlined"
                                  sx={{ borderRadius: '6px' }}
                                />
                              </Grid>
                            )}
                          </Grid>
                        </Box>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <Tooltip
                        title="Get download links from available mirrors"
                        arrow
                        placement="top"
                      >
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<GetAppIcon />}
                          onClick={() => handleGetLinks(book)}
                          fullWidth
                          sx={{ 
                            py: 1.2,
                            fontWeight: 600,
                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.18)',
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
                          aria-label={`Get download links for ${book.Title || 'book'}`}
                        >
                          Get Download Links
                        </Button>
                      </Tooltip>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        
        <Dialog 
          open={!!selectedBook} 
          onClose={handleCloseDialog} 
          maxWidth="md" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
            }
          }}
          keepMounted
          disableEnforceFocus
          disablePortal
          aria-labelledby="book-download-dialog-title"
          aria-describedby="book-download-dialog-description"
        >
          <DialogTitle 
            id="book-download-dialog-title"
            sx={{ 
              px: 3, 
              py: 3,
              bgcolor: 'primary.main', 
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundImage: 'linear-gradient(120deg, #2563eb, #4f46e5)',
              borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <Box>
              <Typography 
                variant="h6" 
                component="div" 
                fontWeight={700}
                sx={{
                  letterSpacing: '-0.01em',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <DownloadIcon sx={{ mr: 1.5, fontSize: '1.2em' }} />
                Download Options
              </Typography>
              {selectedBook && (
                <Typography 
                  variant="body2" 
                  color="white" 
                  sx={{ 
                    opacity: 0.9, 
                    mt: 0.5,
                    maxWidth: '80ch',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {selectedBook.Title || ''} {selectedBook.Author ? `- ${selectedBook.Author}` : ''}
                </Typography>
              )}
            </Box>
            <IconButton 
              onClick={handleCloseDialog} 
              sx={{ 
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.15)'
                }
              }}
              aria-label="close dialog"
              edge="end"
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          
          <DialogContent 
            id="book-download-dialog-description"
            sx={{ 
              px: { xs: 2, sm: 3 }, 
              py: { xs: 3, sm: 4 },
              bgcolor: 'background.paper'
            }}
          >
            {linkLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4, flexDirection: 'column', alignItems: 'center' }}>
                <CircularProgress size={48} thickness={3.5} color="primary" />
                <Typography sx={{ mt: 2, color: 'text.secondary', fontWeight: 500 }}>
                  Fetching download links...
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary', textAlign: 'center', maxWidth: '400px' }}>
                  The application is connecting to LibGen mirrors to retrieve download options.
                  This may take a moment depending on server response times.
                </Typography>
              </Box>
            ) : error ? (
              <Box sx={{ 
                textAlign: 'center', 
                py: 4, 
                px: 3, 
                bgcolor: '#FFF5F5', 
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'error.light'
              }}>
                <Typography color="error.main" sx={{ fontWeight: 600, mb: 1 }}>
                  {error}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  The book might be temporarily unavailable or the server could be experiencing issues.
                  <br />Please try again later or try another book.
                </Typography>
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    onClick={() => handleGetLinks(selectedBook)}
                    startIcon={<GetAppIcon />}
                    size="small"
                  >
                    Try Again
                  </Button>
                </Box>
              </Box>
            ) : downloadLinks ? (
              <List sx={{ py: 1 }}>
                {Array.isArray(downloadLinks) ? (
                  // If downloadLinks is an array of objects with url and source properties
                  downloadLinks.map((link, index) => (
                    <ListItem 
                      key={index}
                      divider={index < downloadLinks.length - 1}
                      sx={{ 
                        px: 3, 
                        py: 2.5,
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          bgcolor: 'rgba(0,0,0,0.02)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                        },
                        borderRadius: 2,
                        display: 'block',
                        mb: 2,
                        border: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      <Typography 
                        fontWeight={600} 
                        variant="subtitle1" 
                        sx={{ 
                          color: 'primary.main',
                          mb: 1,
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <DownloadIcon sx={{ mr: 1, fontSize: '0.9em', opacity: 0.8 }} />
                        {link.source === 'Mirror 1' ? 'Cloudflare' : 
                         link.source === 'Mirror 2' ? 'GET' : 
                         link.source === 'Mirror 3' ? 'IPFS.io' : link.source}
                      </Typography>
                      
                      <Box sx={{ position: 'relative' }}>
                        <Tooltip title="This is the source URL that will be opened in a new tab" arrow>
                          <Box sx={{ position: 'absolute', top: -5, right: -5, cursor: 'help' }}>
                            <InfoIcon sx={{ fontSize: '1rem', color: 'text.secondary', opacity: 0.7 }} />
                          </Box>
                        </Tooltip>
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ 
                            wordBreak: 'break-all',
                            whiteSpace: 'normal',
                            mb: 2,
                            fontFamily: 'monospace',
                            fontSize: '0.85rem',
                            bgcolor: 'rgba(0,0,0,0.03)',
                            py: 1,
                            px: 1.5,
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                            overflowX: 'auto',
                            maxWidth: '100%'
                          }}
                        >
                          {link.url}
                        </Typography>
                      </Box>
                      
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          justifyContent: 'flex-end',
                          mt: 1
                        }}
                      >
                        <Tooltip
                          title="Download will open in a new tab from the source mirror"
                          arrow
                          placement="top"
                        >
                          <Button 
                            variant="contained" 
                            color="primary"
                            startIcon={<DownloadIcon />}
                            size="medium"
                            sx={{ 
                              fontWeight: 500,
                              px: 3,
                              boxShadow: '0 4px 10px rgba(37, 99, 235, 0.2)',
                              '&:hover': {
                                boxShadow: '0 6px 15px rgba(37, 99, 235, 0.3)',
                                bgcolor: 'primary.dark'
                              }
                            }}
                            component="a"
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Download ${selectedBook?.Title || 'book'} (opens in new tab)`}
                            onClick={(e) => {
                              // Log analytics event but don't block the navigation
                              console.log('Download initiated for:', selectedBook?.Title, 'with source:', link.source);
                            }}
                          >
                            Download
                          </Button>
                        </Tooltip>
                      </Box>
                    </ListItem>
                  ))
                ) : (
                  // Fallback for legacy object format - our new api.getDownloadLinks should always return an array
                  <Typography color="text.secondary">No valid download links found</Typography>
                )}
              </List>
            ) : (
              <Typography>Loading download options...</Typography>
            )}
          </DialogContent>
          
          <DialogActions sx={{ px: 3, py: 2, bgcolor: 'background.default', borderTop: '1px solid', borderColor: 'divider' }}>
            <Button 
              onClick={handleCloseDialog} 
              color="primary"
              variant="outlined"
              sx={{ px: 3, py: 1 }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Fade>
  );
};

export default BookList; 