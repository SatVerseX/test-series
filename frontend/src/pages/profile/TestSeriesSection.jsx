import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, Chip, LinearProgress, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { alpha, useTheme } from '@mui/material/styles';
import { api } from '../../services/api';
import { toast } from 'react-hot-toast';
import { CheckCircleIcon } from '@mui/icons-material';

const TestSeriesSection = () => {
  const theme = useTheme();
  const [testSeries, setTestSeries] = useState([]);
  const [testCompletionStatus, setTestCompletionStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch user stats first
        const statsResponse = await api.get('/api/user/test-stats');
        setStatsData(statsResponse.data);

        // Fetch enrolled test series
        const seriesResponse = await api.get('/api/test-series/enrolled');
        const seriesData = seriesResponse.data;
        setTestSeries(seriesData);

        // Create completion status map
        const completionStatus = {};
        
        // For each test series, fetch individual test completion statuses
        for (const series of seriesData) {
          if (series.tests) {
            for (const test of series.tests) {
              try {
                const statusResponse = await api.get(`/api/tests/${test._id}/check-completion`);
                completionStatus[test._id] = {
                  hasCompleted: statusResponse.data.hasCompleted === true,
                  score: statusResponse.data.score,
                  totalMarks: statusResponse.data.totalMarks,
                  completedAt: statusResponse.data.completedAt,
                  percentageScore: statsResponse.data.averageScore || 0
                };
              } catch (error) {
                console.error(`Error fetching completion status for test ${test._id}:`, error);
                completionStatus[test._id] = { hasCompleted: false };
              }
            }
          }
        }

        setTestCompletionStatus(completionStatus);
      } catch (error) {
        console.error('Error fetching test series data:', error);
        toast.error('Failed to load test series data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>Loading test series...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        My Test Series
      </Typography>
      {testSeries.map((series) => {
        // Use stats data to determine completion
        const isCompleted = statsData?.testsTaken > 0;
        const score = statsData?.averageScore || 0;

        return (
          <Card key={series._id} sx={{ mb: 2, p: 2, position: 'relative' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1">{series.title}</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip label="SSC" size="small" color="primary" variant="outlined" />
                {series.isFree && <Chip label="Free" size="small" color="success" />}
              </Box>
            </Box>

            <Typography variant="body2" color="text.secondary" gutterBottom>
              Progress
            </Typography>

            {isCompleted ? (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={100}
                    sx={{
                      width: '100%',
                      height: 8,
                      borderRadius: 4,
                      bgcolor: alpha(theme.palette.success.light, 0.2),
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                        bgcolor: theme.palette.success.main
                      }
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    1/1
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleIcon sx={{ color: theme.palette.success.main, fontSize: '1rem' }} />
                    <Typography variant="body2" color="success.main" sx={{ fontWeight: 500 }}>
                      Score: 8/10 ({score}%)
                    </Typography>
                  </Box>
                </Box>
              </>
            ) : (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={0}
                    sx={{
                      width: '100%',
                      height: 8,
                      borderRadius: 4,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                      }
                    }}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  0/1
                </Typography>
              </>
            )}

            {series.subscribedDate && (
              <Typography variant="body2" color="text.secondary">
                Subscribed: {format(new Date(series.subscribedDate), 'dd/MM/yyyy')}
              </Typography>
            )}

            <Button
              fullWidth
              variant="contained"
              color="primary"
              component={Link}
              to={`/test-series/${series._id}`}
              sx={{ mt: 2 }}
            >
              Continue
            </Button>
          </Card>
        );
      })}
    </Box>
  );
};

export default TestSeriesSection; 