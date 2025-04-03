import { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  History as HistoryIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../config/firebase';

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalTests: 0,
      averageScore: 0,
      completedTests: 0
    },
    recentTests: [],
    upcomingTests: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          throw new Error('No authenticated user');
        }

        const token = await currentUser.getIdToken();
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/users/${currentUser.uid}/dashboard`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setDashboardData(response.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

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
        Welcome, {auth.currentUser?.displayName || 'User'}!
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Total Tests
            </Typography>
            <Typography variant="h3" color="primary">
              {dashboardData.stats.totalTests}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Average Score
            </Typography>
            <Typography variant="h3" color="primary">
              {dashboardData.stats.averageScore}%
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Completed Tests
            </Typography>
            <Typography variant="h3" color="primary">
              {dashboardData.stats.completedTests}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Tests */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HistoryIcon />
              Recent Tests
            </Typography>
            <List>
              {dashboardData.recentTests.map((test) => (
                <ListItem key={test.testId} divider>
                  <ListItemIcon>
                    <AssessmentIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={test.testName}
                    secondary={
                      <>
                        <Typography component="span" variant="body2">
                          Score: {test.score}%
                        </Typography>
                        <br />
                        <Typography component="span" variant="body2">
                          Completed: {new Date(test.completedAt).toLocaleDateString()}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
              {dashboardData.recentTests.length === 0 && (
                <ListItem>
                  <ListItemText primary="No recent tests available" />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Upcoming Tests */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ScheduleIcon />
              Upcoming Tests
            </Typography>
            <List>
              {dashboardData.upcomingTests.map((test) => (
                <ListItem key={test._id} divider>
                  <ListItemIcon>
                    <AssessmentIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={test.title}
                    secondary={
                      <>
                        <Typography component="span" variant="body2">
                          Subject: {test.subject}
                        </Typography>
                        <br />
                        <Typography component="span" variant="body2">
                          Start Date: {new Date(test.startDate).toLocaleDateString()}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
              {dashboardData.upcomingTests.length === 0 && (
                <ListItem>
                  <ListItemText primary="No upcoming tests available" />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard; 