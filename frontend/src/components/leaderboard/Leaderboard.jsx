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
  alpha
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PersonIcon from '@mui/icons-material/Person';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../config/api';
import { useNavigate } from 'react-router-dom';

const MotionTableRow = motion(TableRow);
const MotionTableCell = motion(TableCell);

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
    setTimeRange(event.target.value);
    setPage(0);
  };

  const getMedalColor = (rank) => {
    switch (rank) {
      case 1:
        return '#FFD700'; // Gold
      case 2:
        return '#C0C0C0'; // Silver
      case 3:
        return '#CD7F32'; // Bronze
      default:
        return theme.palette.primary.main;
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return '#4CAF50'; // Green
    if (score >= 75) return '#2196F3'; // Blue
    if (score >= 60) return '#FFC107'; // Yellow
    return '#F44336'; // Red
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setOpenModal(true);
  };

  const handleCloseDetails = () => {
    setSelectedUser(null);
    setOpenModal(false);
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

  const displayedData = compact ? leaderboardData.slice(0, 5) : leaderboardData;

  return (
    <Box sx={{ p: 3 }}>
      <Paper 
        elevation={0}
        sx={{ 
          p: 3, 
          borderRadius: 2,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.1)}`
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <EmojiEventsIcon sx={{ fontSize: 40, color: theme.palette.primary.main, mr: 2 }} />
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
            Leaderboard
          </Typography>
        </Box>

        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ 
            mb: 3,
            '& .MuiTab-root': {
              color: theme.palette.text.secondary,
              '&.Mui-selected': {
                color: theme.palette.primary.main
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: theme.palette.primary.main
            }
          }}
        >
          <Tab label="All Time" icon={<TrendingUpIcon />} />
          <Tab label="This Month" icon={<TrendingUpIcon />} />
          <Tab label="This Week" icon={<TrendingUpIcon />} />
        </Tabs>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: theme.palette.text.secondary }}>Rank</TableCell>
                <TableCell sx={{ color: theme.palette.text.secondary }}>User</TableCell>
                <TableCell sx={{ color: theme.palette.text.secondary }}>Score</TableCell>
                {!compact && <TableCell sx={{ color: theme.palette.text.secondary }}>Tests Taken</TableCell>}
                {!compact && <TableCell sx={{ color: theme.palette.text.secondary }}>Avg. Time</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              <AnimatePresence>
                {displayedData.map((user, index) => (
                  <MotionTableRow
                    key={user._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    onClick={() => handleUserClick(user)}
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.action.hover, 0.1),
                        transform: 'scale(1.01)',
                        transition: 'transform 0.2s'
                      }
                    }}
                  >
                    <MotionTableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {user.rank <= 3 ? (
                          <EmojiEventsIcon sx={{ color: getMedalColor(user.rank), mr: 1 }} />
                        ) : (
                          <Typography sx={{ ml: 4, color: theme.palette.text.primary }}>{user.rank}</Typography>
                        )}
                      </Box>
                    </MotionTableCell>
                    <MotionTableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          sx={{ 
                            bgcolor: theme.palette.primary.main,
                            mr: 2
                          }}
                        >
                          {user.displayName?.[0]?.toUpperCase() || <PersonIcon />}
                        </Avatar>
                        <Typography sx={{ color: theme.palette.text.primary }}>
                          {user.displayName || 'Anonymous User'}
                        </Typography>
                      </Box>
                    </MotionTableCell>
                    <MotionTableCell>
                      <Chip
                        label={`${user.score}%`}
                        sx={{
                          bgcolor: alpha(getScoreColor(user.score), 0.1),
                          color: getScoreColor(user.score),
                          fontWeight: 'bold'
                        }}
                      />
                    </MotionTableCell>
                    {!compact && (
                      <>
                        <MotionTableCell>
                          <Typography sx={{ color: theme.palette.text.primary }}>{user.testsTaken}</Typography>
                        </MotionTableCell>
                        <MotionTableCell>
                          <Typography sx={{ color: theme.palette.text.primary }}>
                            {Math.floor(user.averageTime / 60)}m {user.averageTime % 60}s
                          </Typography>
                        </MotionTableCell>
                      </>
                    )}
                  </MotionTableRow>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        </TableContainer>
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
            width: compact ? 300 : 400,
            bgcolor: theme.palette.background.paper,
            boxShadow: theme.shadows[24],
            p: 4,
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>
              User Details
            </Typography>
            <IconButton onClick={handleCloseDetails} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
          {selectedUser && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{
                    width: 60,
                    height: 60,
                    bgcolor: theme.palette.primary.main,
                    mr: 2
                  }}
                >
                  {selectedUser.displayName?.[0]?.toUpperCase() || <PersonIcon />}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>
                    {selectedUser.displayName || 'Anonymous User'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    Rank: {selectedUser.rank}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Score: {selectedUser.score}%
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Tests Taken: {selectedUser.testsTaken}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Average Time: {Math.floor(selectedUser.averageTime / 60)}m {selectedUser.averageTime % 60}s
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Modal>
    </Box>
  );
};

export default Leaderboard; 