import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import axios from '../../utils/axios';

const LeaderboardPage = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('all');
  const [subject, setSubject] = useState('all');
  const { currentUser } = useAuth();

  const fetchLeaderboard = useCallback(async () => {
    try {
      const response = await axios.get(`/api/leaderboard?timeRange=${timeRange}&subject=${subject}`);
      setLeaderboard(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to fetch leaderboard data');
    } finally {
      setLoading(false);
    }
  }, [timeRange, subject]);

  useEffect(() => {
    fetchLeaderboard();
    // Set up polling for real-time updates
    const pollInterval = setInterval(fetchLeaderboard, 30000); // Poll every 30 seconds

    return () => clearInterval(pollInterval);
  }, [fetchLeaderboard]);

  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };

  const handleSubjectChange = (event) => {
    setSubject(event.target.value);
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Leaderboard
      </Typography>

      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Time Range</InputLabel>
          <Select value={timeRange} onChange={handleTimeRangeChange} label="Time Range">
            <MenuItem value="all">All Time</MenuItem>
            <MenuItem value="week">This Week</MenuItem>
            <MenuItem value="month">This Month</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Subject</InputLabel>
          <Select value={subject} onChange={handleSubjectChange} label="Subject">
            <MenuItem value="all">All Subjects</MenuItem>
            <MenuItem value="math">Mathematics</MenuItem>
            <MenuItem value="science">Science</MenuItem>
            <MenuItem value="english">English</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Rank</TableCell>
              <TableCell>User</TableCell>
              <TableCell align="right">Tests Taken</TableCell>
              <TableCell align="right">Average Score</TableCell>
              <TableCell align="right">Average Time</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leaderboard.map((entry, index) => (
              <TableRow 
                key={entry.userId}
                sx={{ 
                  backgroundColor: currentUser?.uid === entry.firebaseId ? 'action.selected' : 'inherit'
                }}
              >
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar 
                      src={entry.photoURL} 
                      alt={entry.displayName}
                      sx={{ width: 32, height: 32 }}
                    >
                      {entry.displayName?.[0]}
                    </Avatar>
                    <Typography>{entry.displayName}</Typography>
                  </Box>
                </TableCell>
                <TableCell align="right">{entry.testsTaken}</TableCell>
                <TableCell align="right">
                  {Math.round(entry.totalScore / entry.testsTaken)}%
                </TableCell>
                <TableCell align="right">
                  {Math.round(entry.totalTime / entry.testsTaken / 60)} min
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default LeaderboardPage; 