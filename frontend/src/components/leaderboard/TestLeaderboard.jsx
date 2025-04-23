import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Button,
  alpha,
  TextField,
  InputAdornment,
  TablePagination,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import SearchIcon from '@mui/icons-material/Search';
import GetAppIcon from '@mui/icons-material/GetApp';
import PersonIcon from '@mui/icons-material/Person';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TimelapseIcon from '@mui/icons-material/Timelapse';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../config/api';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';

const MotionTableRow = styled(motion.tr)(({ theme }) => ({
  '&.MuiTableRow-root': {
    transition: 'all 0.3s ease',
  }
}));

const MotionTableCell = motion(TableCell);

// Animation variants
const tableRowVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: [0.43, 0.13, 0.23, 0.96]
    }
  }),
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
};

const TestLeaderboard = ({ testId, testTitle, compact = false }) => {
  const { user, api: authApi } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [timeRange, setTimeRange] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [testData, setTestData] = useState(null);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [csvData, setCsvData] = useState([]);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (!testId) return;

    // Cleanup function for previous requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsFetchingData(true);
    setLoading(true);

    // Define fetchData function within useEffect to handle both API calls
    const fetchData = async () => {
      try {
        setError('');
        // Use the auth API instance if available (from useAuth), otherwise use the imported API
        const apiToUse = authApi || api;

        // First, make sure the test exists
        let testData = null;
        try {
          const testResponse = await apiToUse.get(`/api/tests/${testId}`, {
            signal: controller.signal,
            timeout: 15000 // Add a more reasonable timeout
          });

          if (testResponse.data) {
            testData = testResponse.data;
            setTestData(testResponse.data);
          } else {
            setError('Test not found. Please select a valid test.');
            setLoading(false);
            setIsFetchingData(false);
            return;
          }
        } catch (testErr) {
          // Only log error if not aborted
          if (!controller.signal.aborted) {
            console.error('Error fetching test details:', testErr);
          }
        }
        
        // If testData is null and request wasn't aborted, retry once
        if (!testData && !controller.signal.aborted) {
          try {
            const retryResponse = await apiToUse.get(`/api/tests/${testId}`, {
              signal: controller.signal,
              timeout: 15000
            });
            testData = retryResponse.data;
            setTestData(retryResponse.data);
          } catch (retryErr) {
            if (!controller.signal.aborted) {
              console.error('Error retrying test details fetch:', retryErr);
            }
          }
        }

        // Proceed with leaderboard only if request wasn't aborted
        if (!controller.signal.aborted) {
          try {
            // Now fetch the leaderboard data
            const response = await apiToUse.get(`/api/leaderboard/test/${testId}`, {
              params: {
                page: currentPage + 1,
                limit: rowsPerPage,
                timeRange
              },
              signal: controller.signal,
              timeout: 15000 // Add a more reasonable timeout
            });

            if (response.data && !controller.signal.aborted) {
              // Check the structure of the response
              console.log('Leaderboard API response:', response.data);
              
              // Handle both array format and object with leaderboard property
              const leaderboardEntries = Array.isArray(response.data) 
                ? response.data 
                : (response.data.leaderboard || []);
                
              // Get pagination info if available
              const totalPagesCount = response.data.totalPages || 
                                      response.data.pagination?.totalPages || 
                                      Math.ceil(leaderboardEntries.length / rowsPerPage) || 
                                      1;
              
              setLeaderboardData(leaderboardEntries);
              setFilteredData(leaderboardEntries);
              setTotalPages(totalPagesCount);

              // Prepare CSV data
              const csvData = [
                ['Rank', 'Name', 'Score', 'Accuracy', 'Time Taken', 'Date Completed']
              ];

              leaderboardEntries.forEach((entry, index) => {
                csvData.push([
                  index + 1,
                  entry.displayName || entry.name || 'Anonymous',
                  entry.score || 0,
                  formatAccuracy(entry.accuracy),
                  formatTime(entry.averageTime || entry.timeTaken || 0),
                  new Date(entry.updatedAt || entry.completedAt || new Date()).toLocaleDateString()
                ]);
              });

              setCsvData(csvData);
            }
          } catch (leaderboardErr) {
            if (!controller.signal.aborted) {
              console.error('Error fetching leaderboard:', leaderboardErr);
              
              if (leaderboardErr.response?.status === 401) {
                setError('You need to be logged in to view the leaderboard.');
              } else if (leaderboardErr.response?.status === 404) {
                setError('Leaderboard not found for this test.');
              } else {
                setError('Failed to load leaderboard data. Please try again later.');
              }
              
              // Try to retry the leaderboard fetch once
              try {
                const retryResponse = await apiToUse.get(`/api/leaderboard/test/${testId}`, {
                  params: {
                    page: currentPage,
                    limit: rowsPerPage,
                    timeRange
                  },
                  signal: controller.signal,
                  timeout: 15000
                });
                
                if (retryResponse.data && !controller.signal.aborted) {
                  setError(''); // Clear error if retry succeeds
                  
                  // Use the same processing logic as the main handler
                  console.log('Leaderboard API retry response:', retryResponse.data);
                  
                  // Handle both array format and object with leaderboard property
                  const leaderboardEntries = Array.isArray(retryResponse.data) 
                    ? retryResponse.data 
                    : (retryResponse.data.leaderboard || []);
                    
                  // Get pagination info if available
                  const totalPagesCount = retryResponse.data.totalPages || 
                                         retryResponse.data.pagination?.totalPages || 
                                         Math.ceil(leaderboardEntries.length / rowsPerPage) || 
                                         1;
                
                  setLeaderboardData(leaderboardEntries);
                  setFilteredData(leaderboardEntries);
                  setTotalPages(totalPagesCount);
                }
              } catch (retryErr) {
                if (!controller.signal.aborted) {
                  console.error('Error retrying leaderboard fetch:', retryErr);
                }
              }
            }
          }
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setIsFetchingData(false);
        }
      }
    };

    // Start the data fetching
    fetchData();

    return () => {
      // Clean up any pending requests when the component unmounts
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setIsFetchingData(false);
    };
  }, [testId, timeRange, currentPage, rowsPerPage, authApi]);

  // Filter data based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredData(leaderboardData);
      return;
    }
    
    const lowercaseQuery = searchQuery.toLowerCase();
    const filtered = leaderboardData.filter(user => 
      (user.name?.toLowerCase().includes(lowercaseQuery)) || 
      (user.displayName?.toLowerCase().includes(lowercaseQuery)) ||
      (user.level?.toLowerCase().includes(lowercaseQuery))
    );
    
    setFilteredData(filtered);
  }, [searchQuery, leaderboardData]);

  // Set filtered data when leaderboard data changes
  useEffect(() => {
    setFilteredData(leaderboardData);
  }, [leaderboardData]);

  const handlePageChange = (event, page) => {
    setCurrentPage(page);
  };

  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
    setCurrentPage(0); // Reset to first page when changing time range
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setCurrentPage(0);
  };

  const formatTime = (seconds) => {
    if (!seconds) return 'N/A';
    
    // Handle large time values by showing hours if needed
    if (seconds >= 3600) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const remainingSeconds = seconds % 60;
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    // If only seconds, just show seconds
    if (minutes === 0) {
      return `${remainingSeconds}s`;
    }
    
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatAccuracy = (accuracy) => {
    if (accuracy === null || accuracy === undefined || isNaN(accuracy)) return 'N/A';
    return `${Math.round(accuracy)}%`;
  };

  const getDateDisplay = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getCsvFilename = () => {
    const currentDate = new Date().toLocaleDateString().replace(/\//g, '-');
    return `${testTitle ? testTitle.replace(/\s+/g, '_') : 'test'}_leaderboard_${timeRange}_${currentDate}.csv`;
  };

  const getMedalColor = (rank) => {
    switch (rank) {
      case 1:
        return 'linear-gradient(135deg, #FFD700, #FFC800)'; // Gold with gradient
      case 2:
        return 'linear-gradient(135deg, #E0E0E0, #C0C0C0)'; // Silver with gradient
      case 3:
        return 'linear-gradient(135deg, #CD7F32, #A05A2C)'; // Bronze with gradient
      default:
        return theme.palette.primary.main;
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'linear-gradient(90deg, #4CAF50, #8BC34A)'; // Premium green gradient
    if (score >= 70) return 'linear-gradient(90deg, #2196F3, #03A9F4)'; // Premium blue gradient
    if (score >= 50) return 'linear-gradient(90deg, #FF9800, #FFC107)'; // Premium amber gradient
    return 'linear-gradient(90deg, #F44336, #FF5722)'; // Premium red gradient
  };

  const handleExportCSV = () => {
    // Create CSV content
    const headers = ['Rank', 'Name', 'Level', 'Score', 'Accuracy', 'Time Taken', 'Completed At'];
    const csvRows = [headers];
    
    filteredData.forEach((user, index) => {
      const rank = index + 1 + (currentPage - 1) * rowsPerPage;
      csvRows.push([
        rank,
        user.name || 'Anonymous',
        user.level || 'Beginner',
        user.score,
        formatAccuracy(user.accuracy),
        formatTime(user.timeTaken || user.averageTime || 0),
        user.completedAt || 'N/A'
      ]);
    });
    
    // Convert to CSV format
    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = getCsvFilename();
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', p: 3 }}>
        <Typography color="error" gutterBottom>{error}</Typography>
        {!user && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/login')}
            sx={{ mt: 2 }}
          >
            Login to View Leaderboard
          </Button>
        )}
      </Box>
    );
  }

  const displayedData = compact ? filteredData.slice(0, 5) : filteredData;

  return (
    <Box sx={{ p: 0 }}>
      <Paper 
        elevation={3}
        sx={{ 
          borderRadius: 3,
          background: theme.palette.mode === 'dark' 
            ? `linear-gradient(145deg, ${alpha('#1E1E2E', 0.9)}, ${alpha('#1E1E2E', 0.7)})` 
            : `linear-gradient(145deg, #ffffff, ${alpha('#f8f9fa', 0.7)})`,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          boxShadow: `0 10px 40px ${alpha(theme.palette.common.black, 0.1)}`,
          overflow: 'hidden',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
            backgroundSize: '200% 100%',
            animation: 'gradient-animation 4s ease infinite',
            zIndex: 2
          },
          '@keyframes gradient-animation': {
            '0%': {
              backgroundPosition: '0% 50%'
            },
            '50%': {
              backgroundPosition: '100% 50%'
            },
            '100%': {
              backgroundPosition: '0% 50%'
            }
          }
        }}
      >
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            p: 3,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <EmojiEventsIcon 
              sx={{ 
                fontSize: 32, 
                color: '#FFD700',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                animation: 'float 3s ease-in-out infinite',
                '@keyframes float': {
                  '0%': { transform: 'translateY(0px)' },
                  '50%': { transform: 'translateY(-5px)' },
                  '100%': { transform: 'translateY(0px)' }
                },
                mr: 2
              }} 
            />
            <Box>
              <Typography 
                variant="h5" 
                component="h2" 
                sx={{ 
                  fontWeight: 'bold',
                  background: 'linear-gradient(90deg, #4158D0, #C850C0, #FFCC70)',
                  backgroundSize: '200% auto',
                  animation: 'gradient-text 4s linear infinite',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  '@keyframes gradient-text': {
                    '0%': { backgroundPosition: '0% center' },
                    '100%': { backgroundPosition: '200% center' }
                  }
                }}
              >
                Test Leaderboard
              </Typography>
              {testData && (
                <Typography variant="subtitle1" color="text.secondary">
                  {testData.title}
                </Typography>
              )}
            </Box>
          </Box>
          
          {testData && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Chip 
                icon={<AssessmentIcon fontSize="small" />}
                label={`${testData.totalQuestions || 0} Questions`} 
                sx={{ mr: 1 }}
              />
              {testData.duration && (
                <Chip 
                  icon={<TimelapseIcon fontSize="small" />}
                  label={`${testData.duration} mins`} 
                />
              )}
            </Box>
          )}
        </Box>

        {/* Filters and Search Section */}
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: 'center', 
            justifyContent: 'space-between',
            gap: 2,
            p: 2,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: isMobile ? '100%' : 'auto' }}>
            <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRange}
                onChange={handleTimeRangeChange}
                label="Time Range"
                sx={{ 
                  borderRadius: 2,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: alpha(theme.palette.divider, 0.3)
                  }
                }}
              >
                <MenuItem value="all">All Time</MenuItem>
                <MenuItem value="month">This Month</MenuItem>
                <MenuItem value="week">This Week</MenuItem>
                <MenuItem value="day">Today</MenuItem>
              </Select>
            </FormControl>
            
            {!compact && (
              <Tooltip title="Export as CSV">
                <IconButton 
                  color="primary" 
                  onClick={handleExportCSV}
                  sx={{ 
                    ml: 1, 
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                  }}
                >
                  <GetAppIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
          
          <TextField
            placeholder="Search users..."
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={handleSearchChange}
            sx={{ 
              width: isMobile ? '100%' : 250,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '& fieldset': {
                  borderColor: alpha(theme.palette.divider, 0.3)
                }
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {filteredData.length === 0 && !loading ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No users found matching your criteria
            </Typography>
            {process.env.NODE_ENV === 'development' && (
              <Box sx={{ mt: 2, p: 2, bgcolor: alpha('#f8f9fa', 0.7), borderRadius: 1 }}>
                <Typography variant="caption" component="div" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                  Debug Info:
                  <br />
                  API Status: {error ? 'Error: ' + error : 'Completed'}
                  <br />
                  Time Range: {timeRange}
                  <br />
                  Page: {currentPage}
                  <br />
                  Total Pages: {totalPages}
                  <br />
                  Filtered Data Length: {filteredData.length}
                  <br />
                  Search Query: {searchQuery || 'None'}
                </Typography>
              </Box>
            )}
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: compact ? 400 : 600 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell 
                    align="center" 
                    width="80px"
                    sx={{ 
                      color: theme.palette.text.secondary, 
                      fontWeight: 'bold',
                      fontSize: '0.85rem',
                      letterSpacing: 0.5,
                      bgcolor: alpha(theme.palette.background.paper, 0.8),
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    RANK
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      color: theme.palette.text.secondary, 
                      fontWeight: 'bold',
                      fontSize: '0.85rem',
                      letterSpacing: 0.5,
                      bgcolor: alpha(theme.palette.background.paper, 0.8),
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    USER
                  </TableCell>
                  <TableCell 
                    align="center"
                    sx={{ 
                      color: theme.palette.text.secondary, 
                      fontWeight: 'bold',
                      fontSize: '0.85rem',
                      letterSpacing: 0.5,
                      bgcolor: alpha(theme.palette.background.paper, 0.8),
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    SCORE
                  </TableCell>
                  <TableCell 
                    align="center"
                    sx={{ 
                      color: theme.palette.text.secondary, 
                      fontWeight: 'bold',
                      fontSize: '0.85rem',
                      letterSpacing: 0.5,
                      bgcolor: alpha(theme.palette.background.paper, 0.8),
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    ACCURACY
                  </TableCell>
                  <TableCell 
                    align="center"
                    sx={{ 
                      color: theme.palette.text.secondary, 
                      fontWeight: 'bold',
                      fontSize: '0.85rem',
                      letterSpacing: 0.5,
                      bgcolor: alpha(theme.palette.background.paper, 0.8),
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    TIME TAKEN
                  </TableCell>
                  <TableCell 
                    align="center"
                    sx={{ 
                      color: theme.palette.text.secondary, 
                      fontWeight: 'bold',
                      fontSize: '0.85rem',
                      letterSpacing: 0.5,
                      bgcolor: alpha(theme.palette.background.paper, 0.8),
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    COMPLETED
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <AnimatePresence>
                  {displayedData.map((userData, index) => {
                    const isCurrentUser = user && userData._id === user._id;
                    const baseIndex = currentPage * rowsPerPage;
                    const rank = baseIndex + index + 1;
                    
                    return (
                      <MotionTableRow
                        key={userData._id || `user-${index}`}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        custom={index}
                        variants={tableRowVariants}
                        sx={{ 
                          cursor: 'pointer',
                          bgcolor: isCurrentUser ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.03),
                            transform: 'scale(1.003)',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                          }
                        }}
                      >
                        <MotionTableCell 
                          align="center"
                          sx={{ 
                            p: 2,
                            position: 'relative',
                            overflow: 'visible'
                          }}
                        >
                          {rank <= 3 ? (
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: getMedalColor(rank),
                                color: '#fff',
                                fontWeight: 'bold',
                                fontSize: '1.2rem',
                                mx: 'auto',
                                boxShadow: '0 3px 10px rgba(0,0,0,0.2)',
                                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                                border: `2px solid ${rank === 1 ? '#FFF9C4' : rank === 2 ? '#F5F5F5' : '#FFCCBC'}`,
                                position: 'relative',
                                overflow: 'hidden',
                                '&::after': {
                                  content: '""',
                                  position: 'absolute',
                                  top: '-50%',
                                  left: '-50%',
                                  width: '200%',
                                  height: '200%',
                                  background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 70%)',
                                  opacity: 0.6
                                }
                              }}
                            >
                              {rank}
                            </Box>
                          ) : (
                            <Typography 
                              sx={{ 
                                fontWeight: 600,
                                opacity: 0.8
                              }}
                            >
                              {rank}
                            </Typography>
                          )}
                        </MotionTableCell>

                        <MotionTableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar 
                              src={userData.avatar || userData.photoURL}
                              alt={userData.name || userData.displayName}
                              sx={{ 
                                width: 40, 
                                height: 40,
                                border: isCurrentUser ? `2px solid ${theme.palette.primary.main}` : 'none',
                                boxShadow: '0 3px 10px rgba(0,0,0,0.1)'
                              }}
                            >
                              {(userData.name || userData.displayName) ? (userData.name || userData.displayName).charAt(0) : <PersonIcon />}
                            </Avatar>
                            <Box sx={{ ml: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography 
                                  sx={{ 
                                    fontWeight: 'bold',
                                    color: isCurrentUser ? theme.palette.primary.main : theme.palette.text.primary
                                  }}
                                >
                                  {userData.name || userData.displayName || 'Anonymous'}
                                </Typography>
                                {isCurrentUser && (
                                  <Chip 
                                    label="You" 
                                    size="small" 
                                    color="primary" 
                                    sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} 
                                  />
                                )}
                              </Box>
                              <Typography variant="body2" color="text.secondary">
                                {userData.level || 'Beginner'}
                              </Typography>
                            </Box>
                          </Box>
                        </MotionTableCell>

                        <MotionTableCell align="center">
                          <Box
                            sx={{
                              display: 'inline-flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                            }}
                          >
                            <Typography 
                              variant="h6"
                              sx={{ 
                                fontWeight: 'bold',
                                background: getScoreColor(userData.score),
                                color: '#fff',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                textShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                position: 'relative',
                                '&::after': {
                                  content: '""',
                                  position: 'absolute',
                                  bottom: -2,
                                  left: '25%',
                                  width: '50%',
                                  height: 2,
                                  borderRadius: 1,
                                  background: getScoreColor(userData.score)
                                }
                              }}
                            >
                              {userData.score}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                display: 'block',
                                color: theme.palette.text.secondary
                              }}
                            >
                              points
                            </Typography>
                          </Box>
                        </MotionTableCell>

                        <MotionTableCell align="center">
                          <Typography 
                            sx={{ 
                              fontWeight: 'bold',
                              color: userData.accuracy >= 80 ? theme.palette.success.main :
                                    userData.accuracy >= 60 ? theme.palette.info.main :
                                    userData.accuracy >= 40 ? theme.palette.warning.main : 
                                    theme.palette.error.main
                            }}
                          >
                            {formatAccuracy(userData.accuracy)}
                          </Typography>
                        </MotionTableCell>

                        <MotionTableCell align="center">
                          <Typography 
                            sx={{ 
                              fontWeight: 500,
                              color: theme.palette.text.primary
                            }}
                          >
                            {formatTime(userData.timeTaken || userData.averageTime)}
                          </Typography>
                        </MotionTableCell>

                        <MotionTableCell align="center">
                          <Typography 
                            variant="body2"
                            sx={{ 
                              color: theme.palette.text.secondary
                            }}
                          >
                            {(userData.completedAt || userData.updatedAt) ? new Date(userData.completedAt || userData.updatedAt).toLocaleDateString() : 'N/A'}
                          </Typography>
                        </MotionTableCell>
                      </MotionTableRow>
                    );
                  })}
                </AnimatePresence>
              </TableBody>
            </Table>
          </TableContainer>
        )}
        
        {!compact && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Rows per page</InputLabel>
              <Select
                value={rowsPerPage}
                onChange={handleRowsPerPageChange}
                label="Rows per page"
              >
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={25}>25</MenuItem>
                <MenuItem value={50}>50</MenuItem>
                <MenuItem value={100}>100</MenuItem>
              </Select>
            </FormControl>
            <TablePagination
              component="div"
              count={totalPages * rowsPerPage}
              page={currentPage}
              onPageChange={handlePageChange}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleRowsPerPageChange}
              rowsPerPageOptions={[10, 25, 50, 100]}
            />
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default TestLeaderboard; 