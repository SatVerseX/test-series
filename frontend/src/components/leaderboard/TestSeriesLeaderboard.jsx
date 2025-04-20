import React, { useState, useEffect, useCallback } from 'react';
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
  IconButton,
  Tooltip,
  Button,
  alpha,
  TextField,
  InputAdornment,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Pagination,
  Skeleton,
  Alert,
  TableFooter,
  Stack
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PersonIcon from '@mui/icons-material/Person';
import SearchIcon from '@mui/icons-material/Search';
import GetAppIcon from '@mui/icons-material/GetApp';
import TimerIcon from '@mui/icons-material/Timer';
import FilterListIcon from '@mui/icons-material/FilterList';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import StarIcon from '@mui/icons-material/Star';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../config/api';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import { CSVLink } from 'react-csv';
import { formatDuration } from '../../utils/timeUtils';

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

const TestSeriesLeaderboard = ({ seriesId, testId, seriesTitle, testTitle }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState('all');
  const [userRank, setUserRank] = useState(null);
  const [csvData, setCsvData] = useState([]);
  
  const rowsPerPage = 10;
  
  // Memoize fetchLeaderboard to prevent unnecessary re-renders
  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      let endpoint = testId 
        ? `/api/tests/${testId}/leaderboard` 
        : `/api/test-series/${seriesId}/leaderboard`;
      
      // Add query parameters
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', rowsPerPage);
      
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      if (timeRange !== 'all') {
        params.append('timeRange', timeRange);
      }
      
      const response = await api.get(`${endpoint}?${params.toString()}`);
      
      if (response.data) {
        setLeaderboardData(response.data.leaderboard || []);
        setTotalPages(Math.ceil((response.data.total || 0) / rowsPerPage));
        setUserRank(response.data.userRank || null);
        
        // Prepare CSV data
        const csvData = [
          ['Rank', 'Name', 'Score', 'Accuracy', 'Time Taken', 'Attempts', 'Completed At'],
          ...(response.data.leaderboard || []).map(entry => [
            entry.rank,
            entry.user.name,
            entry.score,
            `${entry.accuracy}%`,
            formatDuration(entry.timeTaken),
            entry.attempts,
            new Date(entry.completedAt).toLocaleString()
          ])
        ];
        setCsvData(csvData);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      if (!isAuthenticated && err.response?.status === 401) {
        setError('Please login to view the leaderboard');
      } else if (err.response?.status === 404) {
        setError('Leaderboard data not found');
      } else {
        setError(err.response?.data?.error || 'Failed to fetch leaderboard data');
      }
      setLeaderboardData([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [seriesId, testId, page, searchQuery, timeRange, isAuthenticated]);
  
  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);
  
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setPage(1); // Reset to first page on new search
  };
  
  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
    setPage(1); // Reset to first page on new filter
  };
  
  const getOrdinalSuffix = (number) => {
    if (number === 11 || number === 12 || number === 13) return 'th';
    
    const lastDigit = number % 10;
    switch (lastDigit) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };
  
  // Render loading skeleton
  if (loading) {
    return (
      <Paper
        elevation={2}
        sx={{
          p: 3,
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton variant="text" width={300} height={40} />
          <Skeleton variant="rectangular" width={120} height={36} />
        </Box>
        
        <Skeleton variant="rectangular" width="100%" height={56} sx={{ mb: 2 }} />
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><Skeleton variant="text" width={50} /></TableCell>
                <TableCell><Skeleton variant="text" width={150} /></TableCell>
                <TableCell><Skeleton variant="text" width={80} /></TableCell>
                <TableCell><Skeleton variant="text" width={80} /></TableCell>
                {!isMobile && (
                  <>
                    <TableCell><Skeleton variant="text" width={80} /></TableCell>
                    <TableCell><Skeleton variant="text" width={80} /></TableCell>
                  </>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.from(new Array(5)).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton variant="text" width={30} /></TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Skeleton variant="circular" width={32} height={32} sx={{ mr: 1 }} />
                      <Skeleton variant="text" width={120} />
                    </Box>
                  </TableCell>
                  <TableCell><Skeleton variant="text" width={50} /></TableCell>
                  <TableCell><Skeleton variant="text" width={50} /></TableCell>
                  {!isMobile && (
                    <>
                      <TableCell><Skeleton variant="text" width={50} /></TableCell>
                      <TableCell><Skeleton variant="text" width={50} /></TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Skeleton variant="rectangular" width={300} height={40} />
        </Box>
      </Paper>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <Paper
        elevation={2}
        sx={{
          p: 3,
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        
        {!isAuthenticated && error.includes('login') && (
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Button 
              variant="contained" 
              href="/login" 
              startIcon={<LockOpenIcon />}
            >
              Login to View Leaderboard
            </Button>
          </Box>
        )}
      </Paper>
    );
  }
  
  // CSV filename
  const csvFilename = testId 
    ? `${testTitle || 'Test'}_Leaderboard.csv`
    : `${seriesTitle || 'Series'}_Leaderboard.csv`;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Paper
        elevation={2}
        sx={{
          p: 3,
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h5" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center' }}>
            <EmojiEventsIcon sx={{ mr: 1, color: theme.palette.warning.main }} />
            {testId ? testTitle : (seriesTitle ? `${seriesTitle} Leaderboard` : 'Series Leaderboard')}
          </Typography>
          
          {leaderboardData.length > 0 && (
            <Button
              variant="outlined"
              color="primary"
              startIcon={<CloudDownloadIcon />}
              component={CSVLink}
              data={csvData}
              filename={csvFilename}
              sx={{ 
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'none'
                }
              }}
            >
              Export
            </Button>
          )}
        </Box>
        
        {/* User's rank */}
        {userRank && (
          <Box 
            sx={{ 
              mb: 3, 
              p: 2, 
              borderRadius: 2, 
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
            }}
          >
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Your Performance
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Chip 
                icon={<StarIcon />} 
                label={`${userRank.rank}${getOrdinalSuffix(userRank.rank)} Rank`} 
                color="primary" 
                variant="outlined"
              />
              <Chip 
                icon={<EmojiEventsIcon />} 
                label={`Score: ${userRank.score}`} 
                color="success" 
                variant="outlined"
              />
              <Chip 
                icon={<AccessTimeIcon />} 
                label={`Time: ${formatDuration(userRank.timeTaken)}`} 
                color="secondary" 
                variant="outlined"
              />
              {userRank.accuracy !== undefined && (
                <Chip 
                  icon={<PersonIcon />} 
                  label={`Accuracy: ${userRank.accuracy}%`} 
                  color="info" 
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
        )}
        
        {/* Search and filter */}
        <Box 
          sx={{ 
            mb: 3, 
            display: 'flex', 
            flexDirection: isTablet ? 'column' : 'row',
            gap: 2 
          }}
        >
          <TextField
            label="Search by name"
            variant="outlined"
            size="small"
            fullWidth={isTablet}
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1 }}
          />
          
          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="time-range-label">Time Range</InputLabel>
            <Select
              labelId="time-range-label"
              value={timeRange}
              onChange={handleTimeRangeChange}
              label="Time Range"
            >
              <MenuItem value="all">All Time</MenuItem>
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        {/* Leaderboard Table */}
        {leaderboardData.length === 0 ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            No leaderboard entries found for the current filters.
          </Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 'bold' } }}>
                  <TableCell>Rank</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Score</TableCell>
                  <TableCell>Accuracy</TableCell>
                  {!isMobile && (
                    <>
                      <TableCell>Time</TableCell>
                      <TableCell>Date</TableCell>
                    </>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {leaderboardData.map((entry, index) => {
                  // Determine if this is the current user
                  const isCurrentUser = user && entry.user._id === user._id;
                  
                  // Determine rank styling (top 3 get special treatment)
                  let rankColor = 'text.secondary';
                  let rankIcon = null;
                  
                  if (entry.rank === 1) {
                    rankColor = 'warning.main'; // Gold
                    rankIcon = <EmojiEventsIcon fontSize="small" sx={{ color: theme.palette.warning.main }} />;
                  } else if (entry.rank === 2) {
                    rankColor = 'grey.500'; // Silver
                    rankIcon = <EmojiEventsIcon fontSize="small" sx={{ color: theme.palette.grey[500] }} />;
                  } else if (entry.rank === 3) {
                    rankColor = '#CD7F32'; // Bronze
                    rankIcon = <EmojiEventsIcon fontSize="small" sx={{ color: '#CD7F32' }} />;
                  }
                  
                  return (
                    <TableRow 
                      key={index}
                      sx={{
                        bgcolor: isCurrentUser ? alpha(theme.palette.primary.main, 0.1) : 'inherit',
                        '&:hover': {
                          bgcolor: isCurrentUser 
                            ? alpha(theme.palette.primary.main, 0.15) 
                            : alpha(theme.palette.action.hover, 0.1)
                        }
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {rankIcon}
                          <Typography 
                            color={rankColor}
                            sx={{ 
                              fontWeight: entry.rank <= 3 ? 'bold' : 'medium',
                              ml: rankIcon ? 0.5 : 0
                            }}
                          >
                            {entry.rank}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            src={entry.user.avatar} 
                            alt={entry.user.name}
                            sx={{ 
                              width: 32, 
                              height: 32, 
                              mr: 1,
                              bgcolor: entry.user.avatar ? 'transparent' : 'primary.main'
                            }}
                          >
                            {!entry.user.avatar && entry.user.name?.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography fontWeight={isCurrentUser ? 'bold' : 'regular'}>
                            {entry.user.name}
                            {isCurrentUser && (
                              <Typography 
                                component="span" 
                                variant="caption" 
                                sx={{ 
                                  ml: 1, 
                                  bgcolor: 'primary.main', 
                                  color: 'white', 
                                  px: 1, 
                                  py: 0.3, 
                                  borderRadius: 1
                                }}
                              >
                                You
                              </Typography>
                            )}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight="medium">
                          {entry.score}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={`${entry.accuracy}%`} 
                          size="small"
                          sx={{
                            bgcolor: 
                              entry.accuracy >= 90 ? alpha(theme.palette.success.main, 0.1) :
                              entry.accuracy >= 70 ? alpha(theme.palette.info.main, 0.1) :
                              entry.accuracy >= 50 ? alpha(theme.palette.warning.main, 0.1) :
                              alpha(theme.palette.error.main, 0.1),
                            color: 
                              entry.accuracy >= 90 ? theme.palette.success.main :
                              entry.accuracy >= 70 ? theme.palette.info.main :
                              entry.accuracy >= 50 ? theme.palette.warning.main :
                              theme.palette.error.main,
                            fontWeight: 'medium'
                          }}
                        />
                      </TableCell>
                      {!isMobile && (
                        <>
                          <TableCell>
                            <Tooltip title="Time taken to complete">
                              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                                <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, opacity: 0.7 }} />
                                {formatDuration(entry.timeTaken)}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(entry.completedAt).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Pagination 
              count={totalPages} 
              page={page} 
              onChange={handleChangePage}
              color="primary"
              size={isMobile ? "small" : "medium"}
            />
          </Box>
        )}
      </Paper>
    </motion.div>
  );
};

export default TestSeriesLeaderboard; 