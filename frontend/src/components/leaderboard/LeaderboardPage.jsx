import React from 'react';
import { Container, Paper, Typography, Box } from '@mui/material';
import Leaderboard from './Leaderboard';

const LeaderboardPage = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          borderRadius: 2,
          background: 'linear-gradient(145deg, #ffffff, #f0f0f0)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold' }}>
            Global Leaderboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            See where you stand among the top performers
          </Typography>
        </Box>
        
        <Leaderboard />
      </Paper>
    </Container>
  );
};

export default LeaderboardPage; 