import React from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';

const UserPerformanceCard = ({ score, accuracy, timeTaken }) => {
  // Format accuracy value to ensure it shows as a percentage
  const formatAccuracy = (accuracy) => {
    if (accuracy === null || accuracy === undefined || isNaN(accuracy)) return 'N/A';
    return `${Math.round(accuracy)}%`;
  };

  // Format time in a readable way
  const formatTime = (seconds) => {
    if (!seconds) return 'N/A';
    
    // Handle large time values by showing hours if needed
    if (seconds >= 3600) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const remainingSeconds = seconds % 60;
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    // If only seconds, just show seconds
    if (minutes === 0) {
      return `${remainingSeconds}s`;
    }
    
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
        Your Performance
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={4}>
          <Paper elevation={1} sx={{ p: 2, bgcolor: 'background.paper', textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">Your Score</Typography>
            <Typography variant="h4" color="primary.main">
              {score || 0}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper elevation={1} sx={{ p: 2, bgcolor: 'background.paper', textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">Accuracy</Typography>
            <Typography variant="h4" color="success.main">
              {formatAccuracy(accuracy)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper elevation={1} sx={{ p: 2, bgcolor: 'background.paper', textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">Time Taken</Typography>
            <Typography variant="h4" color="info.main">
              {formatTime(timeTaken)}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserPerformanceCard; 