import React, { useState, useEffect } from "react";
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import { useExamCategory } from "../contexts/ExamCategoryContext";
import { useNavigate } from "react-router-dom";
import Leaderboard from "../components/leaderboard/Leaderboard";
import CategoryWelcome from "../components/dashboard/CategoryWelcome";
import { formatDistanceToNow } from 'date-fns';

const Dashboard = () => {
  const { user, api } = useAuth();
  const { selectedCategory, loading: categoryLoading } = useExamCategory();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCategoryWelcome, setShowCategoryWelcome] = useState(false);
  const [stats, setStats] = useState({
    testsTaken: 0,
    averageScore: 0,
    totalTime: 0,
    recentTests: []
  });

  // Check if we need to show category welcome
  useEffect(() => {
    if (!categoryLoading && user && !selectedCategory) {
      setShowCategoryWelcome(true);
    }
  }, [categoryLoading, user, selectedCategory]);

  useEffect(() => {
    const fetchUserStats = async () => {
      if (!user) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        const response = await api.get(`/api/users/${user.firebaseId}/stats`);
        console.log('User stats received:', response.data);
        setStats(response.data);
        setError(null);
      } catch (error) {
        console.error("Error fetching user stats:", error);
        setError(error.response?.data?.error || "Failed to fetch user stats");
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, [user, navigate, api]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  if (loading || categoryLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // Show category welcome if needed
  if (showCategoryWelcome) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <CategoryWelcome onComplete={() => setShowCategoryWelcome(false)} />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Grid container spacing={3}>
        
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: "100%" }}>
            <Typography variant="h5" gutterBottom>
              Welcome, {user.name || "User"}!
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Paper
                  sx={{
                    p: 2,
                    textAlign: "center",
                    bgcolor: "primary.light",
                    color: "white",
                  }}
                >
                  <Typography variant="h6">Tests Taken</Typography>
                  <Typography variant="h4">{stats.testsTaken}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper
                  sx={{
                    p: 2,
                    textAlign: "center",
                    bgcolor: "secondary.light",
                    color: "white",
                  }}
                >
                  <Typography variant="h6">Average Score</Typography>
                  <Typography variant="h4">{stats.averageScore}%</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper
                  sx={{
                    p: 2,
                    textAlign: "center",
                    bgcolor: "info.light",
                    color: "white",
                  }}
                >
                  <Typography variant="h6">Total Time</Typography>
                  <Typography variant="h4">
                    {Math.floor(stats.totalTime / 60)}h {stats.totalTime % 60}m
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: "100%" }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box display="flex" flexDirection="column" gap={2}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate("/tests")}
                fullWidth
              >
                Take a Test
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => navigate("/tests/categories")}
                fullWidth
              >
                Browse Tests by Category
              </Button>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => navigate("/leaderboard")}
                fullWidth
              >
                View Full Leaderboard
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Recent Tests */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Tests
            </Typography>
            {stats.recentTests && stats.recentTests.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Test Name</TableCell>
                      <TableCell>Subject</TableCell>
                      <TableCell align="center">Score</TableCell>
                      <TableCell align="center">Status</TableCell>
                      <TableCell align="right">Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.recentTests.map(test => (
                      <TableRow 
                        key={test.id}
                        hover
                        onClick={() => {
                          if (test.status === 'completed') {
                            navigate(`/test-results/${test.testId}/${user.firebaseId}`);
                          } else if (test.status === 'in_progress') {
                            navigate(`/test-attempt/${test.testId}`);
                          }
                        }}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>{test.title}</TableCell>
                        <TableCell>{test.subject}</TableCell>
                        <TableCell align="center">
                          {test.status === 'completed' ? (
                            <>
                              {`${test.score.toFixed(0)}%`}
                              {test.correctAnswers && test.totalQuestions && (
                                <Typography variant="caption" display="block" color="text.secondary">
                                  ({test.correctAnswers}/{test.totalQuestions} pts)
                                </Typography>
                              )}
                            </>
                          ) : '-'}
                        </TableCell>
                        <TableCell align="center">
                          {test.status === 'completed' ? (
                            <Chip 
                              size="small"
                              label={test.passed ? "Passed" : "Failed"}
                              color={test.passed ? "success" : "error"}
                            />
                          ) : (
                            <Chip 
                              size="small"
                              label={test.status === 'in_progress' ? "In Progress" : test.status}
                              color="warning"
                            />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {formatDate(test.completedAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body1" color="text.secondary">
                No recent tests to display
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Top Performers
            </Typography>
            <Box sx={{ maxHeight: 400, overflow: "auto" }}>
              <Leaderboard compact={true} />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
