import React, { useEffect, useState } from 'react';
import { Card, Box, Typography, LinearProgress } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';

const TestSeriesCard = ({ testSeries, testCompletionStatus }) => {
  const theme = useTheme();
  const [progress, setProgress] = useState({ completed: 0, total: 0, percentage: 0 });

  const calculateProgress = (testSeries) => {
    if (!testSeries) return { completed: 0, total: 0 };
    
    // Get completion status from the testCompletionStatus prop
    const completedTests = testSeries.tests?.filter(test => 
      testCompletionStatus[test._id]?.hasCompleted
    ).length || 0;
    
    const totalTests = testSeries.tests?.length || 0;
    
    return {
      completed: completedTests,
      total: totalTests,
      percentage: totalTests > 0 ? (completedTests / totalTests) * 100 : 0
    };
  };

  useEffect(() => {
    const progress = calculateProgress(testSeries);
    setProgress(progress);
  }, [testSeries, testCompletionStatus]);

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, pt: 0 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Progress
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <LinearProgress
            variant="determinate"
            value={progress.percentage}
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
        <Typography variant="body2" color="text.secondary">
          {progress.completed}/{progress.total}
        </Typography>
      </Box>
    </Card>
  );
};

export default TestSeriesCard; 