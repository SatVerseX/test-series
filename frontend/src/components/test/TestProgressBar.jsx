import React from 'react';
import {
  Box,
  LinearProgress,
  Typography,
  Grid,
  Paper,
  useTheme,
  useMediaQuery,
  Stack,
  Tooltip,
  Alert
} from '@mui/material';
import {
  CheckCircle as AnsweredIcon,
  BookmarkBorder as MarkedIcon,
  SkipNext as SkippedIcon,
  HelpOutline as NotAttemptedIcon,
  ErrorOutline as ErrorIcon
} from '@mui/icons-material';

const TestProgressBar = ({ stats }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Debug log to help identify issues with stats data
  console.log('Raw progress stats:', stats);
  
  // Check for anomalies in the data
  const hasInvalidData = 
    !stats || 
    typeof stats !== 'object' || 
    stats.total <= 0 || 
    stats.answered > stats.total * 10 || // If answered is more than 10x total, it's invalid
    stats.answered < 0 || 
    isNaN(stats.answered);
  
  // Ensure stats has all expected properties with defaults
  const {
    total = 0,
    answered = 0,
    notVisited = 0,
    visited = 0,
    markedForReview = 0
  } = stats || {};

  // Validate the stats to ensure they're reasonable
  // First, check if total makes sense (should be between 0 and 100 typically)
  let validatedTotal = parseInt(total, 10) || 0;
  if (validatedTotal <= 0 || validatedTotal > 1000) validatedTotal = 10; // Use a reasonable default
  
  // Convert other stats to reasonable values, default to 0 if invalid
  let validatedAnswered;
  
  // Special case: if answered is a large unreasonable number (like 5889 from the logs)
  // or if it's larger than the total, set it to a reasonable value
  const rawAnswered = parseInt(answered, 10);
  if (isNaN(rawAnswered) || rawAnswered > validatedTotal || rawAnswered > 1000) {
    validatedAnswered = 0;
    console.warn(`Invalid answered count detected: ${rawAnswered}. Using 0 instead.`);
  } else {
    validatedAnswered = rawAnswered;
  }
  
  // Process other stats
  const validatedMarked = Math.min(parseInt(markedForReview, 10) || 0, validatedTotal);
  const validatedSkipped = Math.min(parseInt(visited, 10) || 0, validatedTotal);
  
  // Calculate not attempted based on other stats to ensure consistency
  let validatedNotAttempted = validatedTotal - (validatedAnswered + validatedMarked + validatedSkipped);
  if (validatedNotAttempted < 0) validatedNotAttempted = 0;
  
  // If nothing is answered/marked/skipped, all questions should be not attempted
  if (validatedAnswered === 0 && validatedMarked === 0 && validatedSkipped === 0) {
    validatedNotAttempted = validatedTotal;
  }

  const getProgressPercentage = () => {
    if (validatedTotal === 0) return 0;
    // Ensure we return a number, not a string
    return parseFloat(((validatedAnswered / validatedTotal) * 100).toFixed(1));
  };
  
  const progressPercentage = getProgressPercentage();

  return (
    <Box sx={{ width: '100%' }}>
      {/* Show warning if invalid data is detected */}
      {hasInvalidData && (
        <Alert 
          severity="warning" 
          icon={<ErrorIcon />}
          sx={{ mb: 2 }}
        >
          Invalid progress data detected. Please refresh the page or contact support if this persists.
        </Alert>
      )}
    
      {/* Progress bar with percentage */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: isMobile ? 1 : 1.5,
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 0.5 : 0
      }}>
        <Box sx={{ 
          width: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2
        }}>
          <Typography 
            variant={isMobile ? "body2" : "body1"} 
            fontWeight="bold" 
            color="primary"
            sx={{ minWidth: isMobile ? '40px' : '60px' }}
          >
            {progressPercentage.toFixed(1)}%
          </Typography>
          
          <LinearProgress
            variant="determinate"
            value={progressPercentage}
            sx={{
              height: isMobile ? 8 : 10,
              borderRadius: 5,
              width: '100%',
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 5,
                background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.success.main} 100%)`,
              },
            }}
          />
        </Box>
        
        <Tooltip title="Total Questions">
          <Typography 
            variant={isMobile ? "caption" : "body2"} 
            fontWeight="bold"
            sx={{ 
              ml: isMobile ? 0 : 2,
              bgcolor: theme.palette.grey[theme.palette.mode === 'dark' ? 800 : 200],
              px: 1.5,
              py: 0.5,
              borderRadius: 1.5,
              minWidth: isMobile ? '60px' : '80px',
              textAlign: 'center'
            }}
          >
            {validatedTotal} Total
          </Typography>
        </Tooltip>
      </Box>

      {/* Stats grid */}
      <Grid container spacing={isMobile ? 1 : 2}>
        <Grid item xs={3}>
          <Paper
            elevation={0}
            sx={{
              p: isMobile ? 0.75 : 1.5,
              textAlign: 'center',
              borderRadius: 2,
              border: '1px solid',
              borderColor: theme.palette.success.main,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.12)' : 'rgba(76, 175, 80, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.5
            }}
          >
            <Stack direction="row" spacing={0.5} alignItems="center">
              <AnsweredIcon color="success" fontSize={isMobile ? "small" : "medium"} />
              <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 'bold', color: theme.palette.success.main }}>
                {validatedAnswered}
              </Typography>
            </Stack>
            <Typography variant={isMobile ? "caption" : "body2"} sx={{ color: theme.palette.success.main }}>
              Answered
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={3}>
          <Paper
            elevation={0}
            sx={{
              p: isMobile ? 0.75 : 1.5,
              textAlign: 'center',
              borderRadius: 2,
              border: '1px solid',
              borderColor: theme.palette.warning.main,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.12)' : 'rgba(255, 152, 0, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.5
            }}
          >
            <Stack direction="row" spacing={0.5} alignItems="center">
              <MarkedIcon color="warning" fontSize={isMobile ? "small" : "medium"} />
              <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 'bold', color: theme.palette.warning.main }}>
                {validatedMarked}
              </Typography>
            </Stack>
            <Typography variant={isMobile ? "caption" : "body2"} sx={{ color: theme.palette.warning.main }}>
              Marked
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={3}>
          <Paper
            elevation={0}
            sx={{
              p: isMobile ? 0.75 : 1.5,
              textAlign: 'center',
              borderRadius: 2,
              border: '1px solid',
              borderColor: theme.palette.error.main,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(244, 67, 54, 0.12)' : 'rgba(244, 67, 54, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.5
            }}
          >
            <Stack direction="row" spacing={0.5} alignItems="center">
              <SkippedIcon color="error" fontSize={isMobile ? "small" : "medium"} />
              <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 'bold', color: theme.palette.error.main }}>
                {validatedSkipped}
              </Typography>
            </Stack>
            <Typography variant={isMobile ? "caption" : "body2"} sx={{ color: theme.palette.error.main }}>
              Skipped
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={3}>
          <Paper
            elevation={0}
            sx={{
              p: isMobile ? 0.75 : 1.5,
              textAlign: 'center',
              borderRadius: 2,
              border: '1px solid',
              borderColor: theme.palette.grey[500],
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(158, 158, 158, 0.12)' : 'rgba(158, 158, 158, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.5
            }}
          >
            <Stack direction="row" spacing={0.5} alignItems="center">
              <NotAttemptedIcon color="disabled" fontSize={isMobile ? "small" : "medium"} />
              <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 'bold', color: theme.palette.text.secondary }}>
                {validatedNotAttempted}
              </Typography>
            </Stack>
            <Typography variant={isMobile ? "caption" : "body2"} sx={{ color: theme.palette.text.secondary }} noWrap>
              Not Attempted
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TestProgressBar; 