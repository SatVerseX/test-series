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
} from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Leaderboard from "../components/leaderboard/Leaderboard";
import { api } from "../config/api";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    testsTaken: 0,
    averageScore: 0,
    totalTime: 0,
  });

  useEffect(() => {
    const fetchUserStats = async () => {
      if (!user) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        const response = await api.get(`/api/users/${user.firebaseId}/stats`);
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
  }, [user, navigate]);

  if (loading) {
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
            <Typography variant="body1" color="text.secondary">
              No recent tests to display
            </Typography>
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
