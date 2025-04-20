import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Paper,
  CircularProgress
} from '@mui/material';

const SubmitConfirmation = ({ stats, onConfirm, onCancel, isSubmitting }) => {
  const {
    total = 0,
    answered = 0,
    notVisited = 0,
    visited = 0,
    markedForReview = 0
  } = stats || {};

  // Calculate skipped (visited but not answered)
  const skipped = visited - markedForReview;

  return (
    <Dialog
      open={true}
      onClose={!isSubmitting ? onCancel : undefined}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Typography variant="h6" component="div">
          Confirm Test Submission
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Are you sure you want to submit your test? Please review your progress before submitting.
          </Typography>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Paper
              elevation={0}
              sx={{
                p: 1,
                textAlign: 'center',
                bgcolor: 'success.light',
                color: 'success.contrastText',
                borderRadius: 1
              }}
            >
              <Typography variant="h6">{answered}</Typography>
              <Typography variant="body2">Answered</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper
              elevation={0}
              sx={{
                p: 1,
                textAlign: 'center',
                bgcolor: 'warning.light',
                color: 'warning.contrastText',
                borderRadius: 1
              }}
            >
              <Typography variant="h6">{markedForReview}</Typography>
              <Typography variant="body2">Marked</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper
              elevation={0}
              sx={{
                p: 1,
                textAlign: 'center',
                bgcolor: 'error.light',
                color: 'error.contrastText',
                borderRadius: 1
              }}
            >
              <Typography variant="h6">{skipped}</Typography>
              <Typography variant="body2">Skipped</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper
              elevation={0}
              sx={{
                p: 1,
                textAlign: 'center',
                bgcolor: 'grey.200',
                color: 'text.secondary',
                borderRadius: 1
              }}
            >
              <Typography variant="h6">{notVisited}</Typography>
              <Typography variant="body2">Not Visited</Typography>
            </Paper>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" color="error" gutterBottom>
            Note: Once submitted, you cannot make any changes to your answers.
          </Typography>
          {total > 0 && answered < total * 0.5 && (
            <Typography variant="body2" color="warning.dark" gutterBottom sx={{ mt: 1 }}>
              Warning: You've only answered {Math.round((answered / total) * 100)}% of questions. Are you sure you want to submit?
            </Typography>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button 
          onClick={onCancel} 
          color="inherit"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button 
          onClick={onConfirm} 
          variant="contained" 
          color="primary"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Test'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SubmitConfirmation; 