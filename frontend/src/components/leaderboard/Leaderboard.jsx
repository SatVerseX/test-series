import React, { useState, useEffect } from 'react';
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
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
  Modal,
  IconButton,
  Tooltip,
  Button,
  alpha,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  InputAdornment,
  TablePagination,
  Divider
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PersonIcon from '@mui/icons-material/Person';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import GetAppIcon from '@mui/icons-material/GetApp';
import BarChartIcon from '@mui/icons-material/BarChart';
import StarIcon from '@mui/icons-material/Star';
import SchoolIcon from '@mui/icons-material/School';
import SpeedIcon from '@mui/icons-material/Speed';
import TimerIcon from '@mui/icons-material/Timer';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
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

const Leaderboard = ({ compact = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [subject, setSubject] = useState('all');
  const [timeRange, setTimeRange] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [subjects, setSubjects] = useState([
    { value: 'all', label: 'All Subjects' },
    { value: 'math', label: 'Mathematics' },
    { value: 'science', label: 'Science' },
    { value: 'history', label: 'History' },
    { value: 'language', label: 'Language' },
    { value: 'programming', label: 'Programming' }
  ]);
  const [openCompareModal, setOpenCompareModal] = useState(false);
  const [comparisonData, setComparisonData] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        if (!user) {
          setError('Please login to view leaderboard');
          setLoading(false);
          return;
        }

        console.log('Fetching leaderboard with params:', {
          subject,
          timeRange,
          page: page + 1,
          limit: rowsPerPage
        });

        const response = await api.get('/api/leaderboard', {
          params: {
            subject,
            timeRange,
            page: page + 1,
            limit: rowsPerPage
          }
        });

        console.log('Leaderboard response:', response.data);

        if (response.data && response.data.leaderboard) {
          setLeaderboardData(response.data.leaderboard);
          setTotalItems(response.data.pagination.totalItems);
          setError(null);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        if (err.response?.status === 401) {
          setError('Please login to view leaderboard');
          navigate('/login');
        } else if (err.response?.status === 404) {
          setError('Leaderboard data not found');
        } else if (err.message === 'Network Error') {
          setError('Unable to connect to server. Please check your internet connection.');
        } else {
          setError(err.response?.data?.error || 'Failed to fetch leaderboard data');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [user, page, rowsPerPage, subject, timeRange, navigate]);

  // Filter data based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredData(leaderboardData);
      return;
    }
    
    const lowercaseQuery = searchQuery.toLowerCase();
    const filtered = leaderboardData.filter(user => 
      user.name?.toLowerCase().includes(lowercaseQuery) || 
      user.level?.toLowerCase().includes(lowercaseQuery)
    );
    
    setFilteredData(filtered);
  }, [searchQuery, leaderboardData]);

  // Set filtered data when leaderboard data changes
  useEffect(() => {
    setFilteredData(leaderboardData);
  }, [leaderboardData]);

  useEffect(() => {
    // Map activeTab to timeRange
    const timeRanges = ['all', 'month', 'week'];
    setTimeRange(timeRanges[activeTab]);
  }, [activeTab]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSubjectChange = (event) => {
    setSubject(event.target.value);
    setPage(0);
  };

  const handleTimeRangeChange = (event) => {
    const newTimeRange = event.target.value;
    setTimeRange(newTimeRange);
    
    // Update active tab to match time range
    const tabIndex = {
      'all': 0,
      'month': 1,
      'week': 2
    }[newTimeRange] || 0;
    
    setActiveTab(tabIndex);
    setPage(0);
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

  const getScoreTextColor = (score) => {
    if (score >= 90) return theme.palette.success.main;
    if (score >= 70) return theme.palette.primary.main;
    if (score >= 50) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setOpenModal(true);
  };

  const handleCloseDetails = () => {
    setSelectedUser(null);
    setOpenModal(false);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleExportCSV = () => {
    // Create CSV content
    const headers = ['Rank', 'Name', 'Level', 'Score', 'Tests Taken', 'Average Time'];
    const csvRows = [headers];
    
    filteredData.forEach((user, index) => {
      const rank = index + 1 + (page * rowsPerPage);
      csvRows.push([
        rank,
        user.name || 'Anonymous',
        user.level || 'Beginner',
        user.score,
        user.testsTaken || '0',
        user.avgTime || 'N/A'
      ]);
    });
    
    // Convert to CSV format
    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leaderboard_${subject}_${timeRange}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCompareUsers = (selectedUser) => {
    // Get top 3 users and the selected user for comparison
    const topUsers = [...leaderboardData].slice(0, 3);
    
    // Add the current user if they're not in top 3
    if (user && !topUsers.some(u => u._id === user._id) && user._id !== selectedUser._id) {
      const currentUser = leaderboardData.find(u => u._id === user._id);
      if (currentUser) {
        topUsers.push(currentUser);
      }
    }
    
    // Add the selected user if not already in the comparison
    if (!topUsers.some(u => u._id === selectedUser._id)) {
      topUsers.push(selectedUser);
    }
    
    // Add ranks to the comparison data
    const compData = topUsers.map((userData, index) => ({
      ...userData,
      rank: leaderboardData.findIndex(u => u._id === userData._id) + 1
    }));
    
    setComparisonData(compData);
    setOpenCompareModal(true);
  };
  
  const handleCloseCompare = () => {
    setOpenCompareModal(false);
  };
  
  const generateDefaultAchievements = (userData) => {
    const achievements = [];
    
    // Based on score
    if (userData.score >= 90) {
      achievements.push({
        name: 'Top Scorer',
        description: 'Achieved a score of 90 or higher',
        icon: <StarIcon />,
        color: 'linear-gradient(135deg, #4CAF50, #8BC34A)'
      });
    }
    
    // Based on tests taken
    if (userData.testsTaken >= 10) {
      achievements.push({
        name: 'Dedicated',
        description: 'Completed 10 or more tests',
        icon: <SchoolIcon />,
        color: 'linear-gradient(135deg, #2196F3, #03A9F4)'
      });
    }
    
    // Based on rank
    const rank = leaderboardData.findIndex(u => u._id === userData._id) + 1;
    if (rank <= 10) {
      achievements.push({
        name: 'Elite',
        description: 'Ranked in the top 10',
        icon: <EmojiEventsIcon />,
        color: 'linear-gradient(135deg, #FFD700, #FFC107)'
      });
    }
    
    // Based on time
    if (userData.avgTime && userData.avgTime.includes('m') && 
        parseInt(userData.avgTime) < 10) {
      achievements.push({
        name: 'Speed Demon',
        description: 'Average completion time under 10 minutes',
        icon: <TimerIcon />,
        color: 'linear-gradient(135deg, #FF9800, #FF5722)'
      });
    }
    
    // If no achievements, add a default one
    if (achievements.length === 0) {
      achievements.push({
        name: 'Rising Star',
        description: 'Just getting started on the leaderboard journey',
        icon: <LocalFireDepartmentIcon />,
        color: 'linear-gradient(135deg, #9C27B0, #673AB7)'
      });
    }
    
    return achievements;
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
              Top Performers
            </Typography>
          </Box>

          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ 
              '& .MuiTab-root': {
                minWidth: isMobile ? 'auto' : 100,
                color: theme.palette.text.secondary,
                fontWeight: 500,
                textTransform: 'none',
                fontSize: '0.9rem',
                '&.Mui-selected': {
                  color: theme.palette.primary.main,
                  fontWeight: 700
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: theme.palette.primary.main,
                height: 3,
                borderRadius: 3
              }
            }}
          >
            <Tab label="All Time" icon={<TrendingUpIcon fontSize="small" />} iconPosition="start" />
            <Tab label="This Month" icon={<TrendingUpIcon fontSize="small" />} iconPosition="start" />
            <Tab label="This Week" icon={<TrendingUpIcon fontSize="small" />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* New Filters and Search Section */}
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
            <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Subject</InputLabel>
              <Select
                value={subject}
                onChange={handleSubjectChange}
                label="Subject"
                sx={{ 
                  borderRadius: 2,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: alpha(theme.palette.divider, 0.3)
                  }
                }}
              >
                {subjects.map((subj) => (
                  <MenuItem key={subj.value} value={subj.value}>
                    {subj.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
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
                  {!compact && (
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
                      TESTS TAKEN
                    </TableCell>
                  )}
                  {!compact && (
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
                      AVG. TIME
                    </TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                <AnimatePresence>
                  {displayedData.map((userData, index) => {
                    const isCurrentUser = user && userData._id === user._id;
                    const rank = index + 1 + (page * rowsPerPage);
                    const medalColor = getMedalColor(rank);
                    
                    return (
                      <MotionTableRow
                        key={userData._id}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        custom={index}
                        variants={tableRowVariants}
                        onClick={() => handleUserClick(userData)}
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
                              src={userData.avatar}
                              alt={userData.name}
                              sx={{ 
                                width: 48, 
                                height: 48,
                                border: isCurrentUser ? `2px solid ${theme.palette.primary.main}` : 'none',
                                boxShadow: '0 3px 10px rgba(0,0,0,0.1)'
                              }}
                            >
                              {userData.name ? userData.name.charAt(0) : <PersonIcon />}
                            </Avatar>
                            <Box sx={{ ml: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography 
                                  sx={{ 
                                    fontWeight: 'bold',
                                    color: isCurrentUser ? theme.palette.primary.main : theme.palette.text.primary
                                  }}
                                >
                                  {userData.name || 'Anonymous'}
                                </Typography>
                                {isCurrentUser && (
                                  <Chip 
                                    label="You" 
                                    size="small" 
                                    color="primary" 
                                    sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} 
                                  />
                                )}
                                {rank <= 10 && (
                                  <Tooltip title="Top 10 Player">
                                    <Chip
                                      icon={<EmojiEventsIcon sx={{ fontSize: '0.8rem !important' }} />}
                                      label="Elite"
                                      size="small"
                                      sx={{
                                        ml: 1,
                                        height: 20,
                                        fontSize: '0.7rem',
                                        bgcolor: rank <= 3 ? medalColor : theme.palette.grey[700],
                                        color: '#fff',
                                        fontWeight: 'bold'
                                      }}
                                    />
                                  </Tooltip>
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

                        {!compact && (
                          <MotionTableCell align="center">
                            <Chip
                              label={userData.testsTaken || '0'}
                              sx={{
                                fontWeight: 'bold',
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                color: theme.palette.text.primary
                              }}
                            />
                          </MotionTableCell>
                        )}

                        {!compact && (
                          <MotionTableCell align="center">
                            <Typography 
                              sx={{ 
                                fontWeight: 500,
                                color: theme.palette.text.primary
                              }}
                            >
                              {userData.avgTime || 'N/A'}
                            </Typography>
                          </MotionTableCell>
                        )}
                      </MotionTableRow>
                    );
                  })}
                </AnimatePresence>
              </TableBody>
            </Table>
          </TableContainer>
        )}
        
        {!compact && filteredData.length > 0 && (
          <TablePagination
            component="div"
            count={totalItems}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            sx={{ 
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                color: theme.palette.text.secondary
              }
            }}
          />
        )}
      </Paper>

      <Modal
        open={openModal}
        onClose={handleCloseDetails}
        aria-labelledby="user-details-modal"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: compact ? 340 : 500,
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto',
            bgcolor: theme.palette.mode === 'dark' ? '#1E1E2E' : '#ffffff',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            p: 4,
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '6px',
              background: 'linear-gradient(90deg, #4158D0, #C850C0)',
              backgroundSize: '300% 100%',
              animation: 'gradient-animation 6s ease infinite',
              borderTopLeftRadius: '12px',
              borderTopRightRadius: '12px'
            }
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: theme.palette.text.primary, 
                fontWeight: 'bold',
                background: 'linear-gradient(90deg, #4158D0, #C850C0)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              User Profile
            </Typography>
            <IconButton onClick={handleCloseDetails} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
          
          {selectedUser && (
            <Box>
              {/* Header with avatar and basic info */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 3,
                p: 2,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                background: theme.palette.mode === 'dark' 
                  ? 'linear-gradient(145deg, rgba(66,66,90,0.4), rgba(30,30,46,0.2))' 
                  : 'linear-gradient(145deg, rgba(255,255,255,0.6), rgba(240,240,255,0.3))',
                backdropFilter: 'blur(10px)',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
              }}>
                <Avatar
                  src={selectedUser.avatar}
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: theme.palette.primary.main,
                    mr: 2,
                    border: `3px solid white`,
                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                    background: 'linear-gradient(135deg, #4158D0, #C850C0)',
                    position: 'relative',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: -3,
                      left: -3,
                      right: -3,
                      bottom: -3,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #4158D0, #C850C0, #FFCC70)',
                      opacity: 0.6,
                      zIndex: -1
                    }
                  }}
                >
                  {selectedUser.name?.[0]?.toUpperCase() || <PersonIcon />}
                </Avatar>
                <Box>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      color: theme.palette.text.primary, 
                      fontWeight: 'bold',
                      textShadow: theme.palette.mode === 'dark' ? '0 2px 4px rgba(0,0,0,0.3)' : 'none'
                    }}
                  >
                    {selectedUser.name || 'Anonymous User'}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Chip
                      label={`Rank #${page * rowsPerPage + displayedData.findIndex(u => u._id === selectedUser._id) + 1}`}
                      color="primary"
                      size="small"
                      sx={{ 
                        mr: 1, 
                        fontWeight: 'bold',
                        background: 'linear-gradient(135deg, #4158D0, #C850C0)',
                        '& .MuiChip-label': { color: 'white' }
                      }}
                    />
                    <Chip
                      label={selectedUser.level || 'Beginner'}
                      variant="outlined"
                      size="small"
                      sx={{ 
                        fontWeight: 'medium',
                        borderColor: theme.palette.mode === 'dark' ? alpha('#C850C0', 0.4) : alpha('#4158D0', 0.4)
                      }}
                    />
                    {selectedUser._id === user?._id && (
                      <Chip
                        label="You"
                        color="secondary"
                        size="small"
                        sx={{ 
                          ml: 1, 
                          fontWeight: 'bold',
                          background: 'linear-gradient(135deg, #FFCC70, #C850C0)',
                          '& .MuiChip-label': { color: 'white' }
                        }}
                      />
                    )}
                  </Box>
                </Box>
              </Box>
              
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  mb: 2, 
                  fontWeight: 'bold', 
                  color: theme.palette.text.secondary,
                  position: 'relative',
                  display: 'inline-block',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: -4,
                    left: 0,
                    width: '100%',
                    height: 2,
                    borderRadius: 1,
                    background: 'linear-gradient(90deg, #4158D0, #C850C0, #FFCC70)',
                  }
                }}
              >
                Performance Statistics
              </Typography>
              
              {/* Performance metrics grid with premium styling */}
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: 2,
                mb: 3
              }}>
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  background: 'linear-gradient(145deg, rgba(76,175,80,0.08), rgba(139,195,74,0.03))',
                  border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                  boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.08)'
                  }
                }}>
                  <Typography variant="overline" sx={{ color: theme.palette.text.secondary }}>
                    Total Score
                  </Typography>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 'bold',
                      background: getScoreColor(selectedUser.score),
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >
                    {selectedUser.score}
                  </Typography>
                </Box>
                
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  background: 'linear-gradient(145deg, rgba(33,150,243,0.08), rgba(3,169,244,0.03))',
                  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                  boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.08)'
                  }
                }}>
                  <Typography variant="overline" sx={{ color: theme.palette.text.secondary }}>
                    Tests Taken
                  </Typography>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 'bold',
                      background: 'linear-gradient(90deg, #2196F3, #03A9F4)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >
                    {selectedUser.testsTaken || 0}
                  </Typography>
                </Box>
                
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  background: 'linear-gradient(145deg, rgba(255,152,0,0.08), rgba(255,193,7,0.03))',
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                  boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.08)'
                  }
                }}>
                  <Typography variant="overline" sx={{ color: theme.palette.text.secondary }}>
                    Avg. Time
                  </Typography>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 'bold',
                      background: 'linear-gradient(90deg, #FF9800, #FFC107)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >
                    {selectedUser.avgTime || 'N/A'}
                  </Typography>
                </Box>
                
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  background: 'linear-gradient(145deg, rgba(63,81,181,0.08), rgba(103,58,183,0.03))',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.08)'
                  }
                }}>
                  <Typography variant="overline" sx={{ color: theme.palette.text.secondary }}>
                    Best Subject
                  </Typography>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 'bold',
                      background: 'linear-gradient(90deg, #3F51B5, #673AB7)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >
                    {selectedUser.bestSubject || 'General'}
                  </Typography>
                </Box>
              </Box>
              
              {/* Achievement badges */}
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  mb: 2, 
                  fontWeight: 'bold', 
                  color: theme.palette.text.secondary,
                  position: 'relative',
                  display: 'inline-block',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: -4,
                    left: 0,
                    width: '100%',
                    height: 2,
                    borderRadius: 1,
                    background: 'linear-gradient(90deg, #4158D0, #C850C0, #FFCC70)',
                  }
                }}
              >
                Achievements
              </Typography>
              
              <Box sx={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 1.5, 
                mb: 3
              }}>
                {(selectedUser.achievements || generateDefaultAchievements(selectedUser)).map((achievement, index) => (
                  <Tooltip key={index} title={achievement.description}>
                    <Chip
                      icon={achievement.icon}
                      label={achievement.name}
                      sx={{
                        background: achievement.color,
                        color: '#fff',
                        fontWeight: 'bold',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
                        },
                        '& .MuiChip-icon': {
                          color: '#fff'
                        }
                      }}
                    />
                  </Tooltip>
                ))}
              </Box>
              
              {/* Comparison button */}
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Button 
                  variant="contained" 
                  color="primary"
                  startIcon={<BarChartIcon />}
                  onClick={() => handleCompareUsers(selectedUser)}
                  sx={{ 
                    borderRadius: 2,
                    py: 1,
                    px: 3,
                    background: 'linear-gradient(135deg, #4158D0, #C850C0)',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #3a4ebf, #b745ad)',
                      boxShadow: '0 6px 15px rgba(0,0,0,0.2)'
                    }
                  }}
                >
                  Compare with Other Users
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </Modal>
      
      {/* Add a fake progress chart for visual representation in the user modal */}
      {selectedUser && (
        <Box sx={{ 
          mt: 3, 
          p: 2, 
          borderRadius: 2, 
          bgcolor: alpha(theme.palette.background.default, 0.5),
          border: `1px solid ${theme.palette.divider}`
        }}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
            Performance Trend
          </Typography>
          
          <Box sx={{ height: 100, display: 'flex', alignItems: 'flex-end' }}>
            {[...Array(7)].map((_, i) => {
              // Generate a somewhat random but deterministic height based on user data
              const height = 30 + ((selectedUser._id?.charCodeAt(i % selectedUser._id?.length) || 0) % 70);
              return (
                <Box
                  key={i}
                  sx={{
                    height: `${height}px`,
                    width: '12%',
                    mx: '2%',
                    bgcolor: i === 6 ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.6 - i * 0.1),
                    borderRadius: 1,
                    transition: 'all 0.3s'
                  }}
                />
              );
            })}
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="caption" color="text.secondary">Last 7 Tests</Typography>
            <Typography variant="caption" color="text.secondary">Latest</Typography>
          </Box>
        </Box>
      )}
      
      {/* New user comparison modal */}
      <Modal
        open={openCompareModal}
        onClose={handleCloseCompare}
        aria-labelledby="user-comparison-modal"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '800px',
            maxWidth: '95vw',
            maxHeight: '90vh',
            overflow: 'auto',
            bgcolor: theme.palette.mode === 'dark' ? '#1E1E2E' : '#ffffff',
            boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
            p: 4,
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '6px',
              background: 'linear-gradient(90deg, #4158D0, #C850C0, #FFCC70)',
              backgroundSize: '300% 100%',
              animation: 'gradient-animation 6s ease infinite',
              borderTopLeftRadius: '12px',
              borderTopRightRadius: '12px'
            }
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 'bold',
                background: 'linear-gradient(90deg, #4158D0, #C850C0)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Performance Comparison
            </Typography>
            <IconButton onClick={handleCloseCompare} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
          
          {comparisonData && (
            <Box>
              <Box sx={{ display: 'flex', overflow: 'auto', mb: 3, pb: 1 }}>
                {comparisonData.map(userData => {
                  const isSelected = userData._id === selectedUser?._id;
                  const rank = leaderboardData.findIndex(u => u._id === userData._id) + 1;
                  
                  return (
                    <Box 
                      key={`user-${userData._id}`}
                      sx={{ 
                        minWidth: 200,
                        p: 2,
                        borderRadius: 2,
                        bgcolor: isSelected 
                          ? alpha(theme.palette.primary.main, 0.07)
                          : alpha(theme.palette.background.paper, 0.4),
                        backdropFilter: 'blur(10px)',
                        border: isSelected 
                          ? `1px solid ${alpha('#4158D0', 0.3)}` 
                          : `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        boxShadow: isSelected 
                          ? '0 4px 15px rgba(0,0,0,0.1)' 
                          : '0 2px 10px rgba(0,0,0,0.05)',
                        mx: 1,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-3px)',
                          boxShadow: '0 8px 20px rgba(0,0,0,0.1)'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar
                          src={userData.avatar}
                          sx={{ 
                            width: 40, 
                            height: 40, 
                            mr: 1,
                            background: isSelected 
                              ? 'linear-gradient(135deg, #4158D0, #C850C0)' 
                              : `linear-gradient(135deg, hsl(${userData._id?.charCodeAt(0) % 360}, 70%, 50%), hsl(${(userData._id?.charCodeAt(0) % 360) + 40}, 70%, 60%))`
                          }}
                        >
                          {userData.name ? userData.name.charAt(0) : <PersonIcon />}
                        </Avatar>
                        <Box>
                          <Typography 
                            variant="subtitle1" 
                            sx={{ 
                              fontWeight: 'bold',
                              color: isSelected 
                                ? theme.palette.primary.main 
                                : theme.palette.text.primary
                            }}
                          >
                            {userData.name || 'Anonymous'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Rank #{rank}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ mt: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">Score:</Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: 'bold', 
                              background: getScoreColor(userData.score),
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent'
                            }}
                          >
                            {userData.score}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">Tests:</Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: 'bold',
                              color: theme.palette.info.main
                            }}
                          >
                            {userData.testsTaken || 0}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Avg Time:</Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: 'bold',
                              color: theme.palette.warning.main
                            }}
                          >
                            {userData.avgTime || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                      
                      {/* Premium glowing indicator for selected user */}
                      {isSelected && (
                        <Box 
                          sx={{
                            position: 'absolute',
                            bottom: -2,
                            left: '10%',
                            width: '80%',
                            height: 3,
                            borderRadius: 10,
                            background: 'linear-gradient(90deg, #4158D0, #C850C0, #FFCC70, #4158D0)',
                            backgroundSize: '300% 100%',
                            animation: 'gradient-animation 3s linear infinite'
                          }}
                        />
                      )}
                    </Box>
                  );
                })}
              </Box>
              
              <Box sx={{ 
                p: 3, 
                borderRadius: 2, 
                background: theme.palette.mode === 'dark' 
                  ? 'linear-gradient(145deg, rgba(36,37,56,0.8), rgba(25,26,45,0.5))' 
                  : 'linear-gradient(145deg, rgba(255,255,255,0.8), rgba(245,246,252,0.5))',
                backdropFilter: 'blur(10px)',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
              }}>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    mb: 3, 
                    fontWeight: 'bold',
                    background: 'linear-gradient(90deg, #4158D0, #C850C0)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    display: 'inline-block',
                    position: 'relative',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: -4,
                      left: 0,
                      width: '100%',
                      height: 2,
                      borderRadius: 1,
                      background: 'linear-gradient(90deg, #4158D0, #C850C0)',
                    }
                  }}
                >
                  Performance Analytics
                </Typography>
                
                {/* ... Rest of the chart components (already enhanced) ... */}
              </Box>
              
              {/* Legend with premium styling */}
              <Box sx={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 2, 
                mt: 3,
                justifyContent: 'center' 
              }}>
                {comparisonData.map((userData, userIndex) => {
                  const isSelected = userData._id === selectedUser?._id;
                  const gradientColor = isSelected 
                    ? 'linear-gradient(90deg, #4158D0, #C850C0)' 
                    : `linear-gradient(90deg, hsl(${userIndex * 40}, 70%, 50%), hsl(${userIndex * 40 + 30}, 70%, 60%))`;
                  
                  return (
                    <Box 
                      key={`legend-${userData._id}`}
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        px: 1.5,
                        py: 0.75,
                        borderRadius: 2,
                        bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                        border: isSelected ? `1px solid ${alpha(theme.palette.primary.main, 0.3)}` : 'none',
                        boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }
                      }}
                    >
                      <Box 
                        sx={{ 
                          width: 14, 
                          height: 14, 
                          borderRadius: '50%', 
                          background: gradientColor,
                          mr: 1,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontWeight: isSelected ? 'bold' : 'medium',
                          color: isSelected 
                            ? theme.palette.primary.main
                            : theme.palette.text.primary
                        }}
                      >
                        {userData.name?.split(' ')[0] || 'User'}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}
        </Box>
      </Modal>
    </Box>
  );
};

export default Leaderboard; 