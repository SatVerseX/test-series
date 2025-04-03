import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import { EmojiEvents as EmojiEventsIcon } from '@mui/icons-material';
import axios from 'axios';
import { auth } from '../config/firebase';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [subject, setSubject] = useState('all');
  const [timeRange, setTimeRange] = useState('all');
  const [totalItems, setTotalItems] = useState(0);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      const token = await currentUser.getIdToken();
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/leaderboard`,
        {
          params: {
            subject,
            timeRange,
            page: page + 1,
            limit: rowsPerPage,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setLeaderboard(response.data.leaderboard);
      setTotalItems(response.data.pagination.totalItems);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [page, rowsPerPage, subject, timeRange]);

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

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Leaderboard
      </Typography>

      {/* Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Subject</InputLabel>
          <Select value={subject} onChange={handleSubjectChange} label="Subject">
            <MenuItem value="all">All Subjects</MenuItem>
            <MenuItem value="Mathematics">Mathematics</MenuItem>
            <MenuItem value="Physics">Physics</MenuItem>
            <MenuItem value="Chemistry">Chemistry</MenuItem>
            <MenuItem value="Biology">Biology</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Time Range</InputLabel>
          <Select value={timeRange} onChange={handleTimeRangeChange} label="Time Range">
            <MenuItem value="all">All Time</MenuItem>
            <MenuItem value="today">Today</MenuItem>
            <MenuItem value="week">This Week</MenuItem>
            <MenuItem value="month">This Month</MenuItem>
            <MenuItem value="year">This Year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Leaderboard Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Rank</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Grade</TableCell>
              <TableCell>Average Score</TableCell>
              <TableCell>Total Tests</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leaderboard.map((entry, index) => (
              <TableRow key={entry.userId}>
                <TableCell>
                  {index === 0 ? (
                    <EmojiEventsIcon sx={{ color: 'gold' }} />
                  ) : index === 1 ? (
                    <EmojiEventsIcon sx={{ color: 'silver' }} />
                  ) : index === 2 ? (
                    <EmojiEventsIcon sx={{ color: '#cd7f32' }} />
                  ) : (
                    index + 1
                  )}
                </TableCell>
                <TableCell>{entry.name}</TableCell>
                <TableCell>{entry.grade}</TableCell>
                <TableCell>
                  <Chip
                    label={`${entry.averageScore}%`}
                    color={
                      entry.averageScore >= 80
                        ? 'success'
                        : entry.averageScore >= 60
                        ? 'warning'
                        : 'error'
                    }
                  />
                </TableCell>
                <TableCell>{entry.totalTests}</TableCell>
              </TableRow>
            ))}
            {leaderboard.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        component="div"
        count={totalItems}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />
    </Container>
  );
};

export default Leaderboard;
