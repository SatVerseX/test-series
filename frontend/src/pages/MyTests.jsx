import React, { useEffect, useState } from 'react';
import { Container, Typography, Paper, Grid, Tabs, Tab, Box, Button, Chip, LinearProgress } from '@mui/material';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { api } from '../services/api';
import { CheckCircleIcon, PendingIcon, TrendingUpIcon, LibraryBooksIcon, PendingActionsIcon } from '@mui/icons-material';
import { StatCard } from '../components/StatCard';

const MyTests = () => {
  const [activeTab, setActiveTab] = useState('series');
  const [testSeries, setTestSeries] = useState([]);
  const [testCompletionStatus, setTestCompletionStatus] = useState({});
  const [stats, setStats] = useState({
    completedTests: 0,
    averageScore: 0,
    testsInProgress: 0
  });
  const [loading, setLoading] = useState(true);

  const calculateProgress = (testSeries, completionStatus) => {
    if (!testSeries?.tests) return { completed: 0, total: 0 };
    
    const completedTests = testSeries.tests.filter(test => 
      completionStatus[test._id]?.hasCompleted
    ).length || 0;
    
    const totalTests = testSeries.tests.length;
    
    return {
      completed: completedTests,
      total: totalTests,
      percentage: totalTests > 0 ? (completedTests / totalTests) * 100 : 0
    };
  };

  useEffect(() => {
    const fetchTestData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/user/test-stats');
        const { testsTaken, averageScore, recentTests } = response.data;
        
        setStats({
          completedTests: testsTaken,
          averageScore,
          testsInProgress: recentTests.filter(t => t.status === 'in_progress').length
        });
        
        // Update progress for each test series
        const seriesResponse = await api.get('/api/test-series/enrolled');
        setTestSeries(seriesResponse.data);
        
        // Fetch completion status for all tests
        const completionStatus = {};
        for (const series of seriesResponse.data) {
          for (const test of series.tests) {
            const statusResponse = await api.get(`/api/tests/${test._id}/check-completion`);
            completionStatus[test._id] = statusResponse.data;
          }
        }
        setTestCompletionStatus(completionStatus);
        
      } catch (error) {
        console.error('Error fetching test data:', error);
        toast.error('Failed to load test data');
      } finally {
        setLoading(false);
      }
    };

    fetchTestData();
  }, [api]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        My Tests
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Track your progress and manage your test series
      </Typography>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Your Test Overview
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <StatCard
              icon={<CheckCircleIcon />}
              title="Completed Tests"
              value={stats.completedTests}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard
              icon={<PendingIcon />}
              title="Tests in Progress"
              value={stats.testsInProgress}
              color="warning"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard
              icon={<TrendingUpIcon />}
              title="Average Score"
              value={`${stats.averageScore}%`}
              color="success"
            />
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ mb: 3 }}
        >
          <Tab
            icon={<LibraryBooksIcon />}
            label="TEST SERIES"
            value="series"
          />
          <Tab
            icon={<PendingActionsIcon />}
            label="IN PROGRESS"
            value="in_progress"
          />
          <Tab
            icon={<CheckCircleIcon />}
            label="COMPLETED"
            value="completed"
          />
        </Tabs>

        {activeTab === 'series' && (
          <Grid container spacing={3}>
            {testSeries.map((series) => {
              const progress = calculateProgress(series, testCompletionStatus);
              return (
                <Grid item xs={12} sm={6} md={4} key={series._id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {series.title}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        {series.tags?.map(tag => (
                          <Chip key={tag} label={tag} size="small" />
                        ))}
                      </Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Progress: {progress.completed}/{progress.total}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={progress.percentage}
                        sx={{ mb: 2, height: 8, borderRadius: 4 }}
                      />
                      <Button
                        fullWidth
                        variant="contained"
                        color="primary"
                        component={Link}
                        to={`/test-series/${series._id}`}
                      >
                        Continue
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>
    </Container>
  );
};

export default MyTests; 