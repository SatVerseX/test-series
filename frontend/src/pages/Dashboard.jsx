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
  Card,
  CardContent,
  IconButton,
  Divider,
  useTheme,
  alpha,
  Avatar,
  LinearProgress,
} from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import { useExamCategory } from "../contexts/ExamCategoryContext";
import { useNavigate } from "react-router-dom";
import CategoryWelcome from "../components/dashboard/CategoryWelcome";
import { formatDistanceToNow } from 'date-fns';
import { addCacheBusting } from "../utils/clearCache";
import { 
  AssignmentTurnedIn as TestIcon,
  EmojiEvents as TrophyIcon,
  Timer as TimerIcon,
  AddCircleOutline as TakeTestIcon,
  Category as CategoryIcon,
  Leaderboard as LeaderboardIcon,
  MoreHoriz as MoreIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, icon, color, secondaryText }) => {
  const theme = useTheme();
  
  return (
    <Card 
      component={motion.div}
      whileHover={{ 
        y: -5,
        boxShadow: "0 10px 20px rgba(0,0,0,0.1)"
      }}
      sx={{ 
        borderRadius: 3,
        overflow: 'hidden',
        height: '100%',
        boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.1)}`,
        border: `1px solid ${alpha(color, 0.12)}`,
        transition: 'all 0.3s ease-in-out',
        position: 'relative',
        '&:before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '5px',
          backgroundColor: color,
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            sx={{
              backgroundColor: alpha(color, 0.12),
              color: color,
              width: 48,
              height: 48,
              mr: 2,
            }}
          >
            {icon}
          </Avatar>
          <Box>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              {title}
            </Typography>
            <Typography variant="h4" component="div" fontWeight="bold">
              {value}
            </Typography>
            {secondaryText && (
              <Typography variant="caption" color="text.secondary">
                {secondaryText}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const ActionButton = ({ icon, label, onClick, color = "primary", variant = "contained" }) => {
  const theme = useTheme();
  
  return (
    <Button
      variant={variant}
      color={color}
      onClick={onClick}
      fullWidth
      component={motion.button}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      startIcon={icon}
      sx={{
        py: 1.5,
        px: 3,
        borderRadius: 2,
        fontWeight: 600,
        textTransform: 'none',
        boxShadow: variant === 'contained' ? `0 4px 14px ${alpha(theme.palette[color].main, 0.4)}` : 'none',
        fontSize: '0.95rem',
        '&:hover': {
          boxShadow: variant === 'contained' ? `0 6px 20px ${alpha(theme.palette[color].main, 0.6)}` : 'none',
        }
      }}
    >
      {label}
    </Button>
  );
};

const WelcomeHeader = ({ userName }) => {
  const theme = useTheme();
  
  return (
    <Box 
      sx={{
        mb: 4,
        p: 3,
        borderRadius: 3,
        background: `linear-gradient(120deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
        color: 'white',
        boxShadow: `0 10px 20px ${alpha(theme.palette.primary.dark, 0.3)}`,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar
          sx={{
            width: 64,
            height: 64,
            bgcolor: 'white',
            color: theme.palette.primary.dark,
            boxShadow: `0 4px 8px ${alpha('#000', 0.2)}`,
          }}
        >
          <SchoolIcon fontSize="large" />
        </Avatar>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Welcome, {userName || "Scholar"}!
          </Typography>
          <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
            Track your progress and continue your learning journey
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

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
  const theme = useTheme();

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
        const response = await api.get(
          `/api/users/${user.firebaseId}/stats`
        );
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
        flexDirection="column"
        gap={3}
        minHeight="100vh"
        sx={{ 
          background: alpha(theme.palette.background.default, 0.6),
        }}
      >
        <CircularProgress 
          size={60} 
          thickness={4} 
          sx={{ 
            color: theme.palette.primary.main,
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
            }
          }} 
        />
        <Typography variant="h6" color="text.secondary">
          Loading your dashboard...
        </Typography>
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
    <Container 
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      maxWidth="lg" 
      sx={{ mt: 4, mb: 4 }}
    >
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3, 
            borderRadius: 2,
            boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.2)}`
          }}
        >
          {error}
        </Alert>
      )}
      
      <WelcomeHeader userName={user.name} />
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card 
            sx={{ 
              borderRadius: 3,
              p: 2,
              height: '100%',
              boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.1)}`,
              background: `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 1)} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
              backdropFilter: 'blur(10px)'
            }}
          >
            <CardContent>
              <Typography 
                variant="h5" 
                gutterBottom
                sx={{ 
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  mb: 3,
                  color: theme.palette.text.primary,
                  '&:after': {
                    content: '""',
                    display: 'block',
                    height: '2px',
                    background: `linear-gradient(90deg, ${theme.palette.primary.main}, transparent)`,
                    flexGrow: 1,
                    ml: 1
                  }
                }}
              >
                Progress Overview
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <StatCard 
                    title="Tests Taken" 
                    value={stats.testsTaken}
                    icon={<TestIcon fontSize="medium" />}
                    color={theme.palette.primary.main}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <StatCard 
                    title="Average Score" 
                    value={`${stats.averageScore}%`}
                    icon={<TrophyIcon fontSize="medium" />}
                    color={theme.palette.secondary.main}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <StatCard 
                    title="Total Time" 
                    value={`${Math.floor(stats.totalTime / 3600)}h ${Math.floor((stats.totalTime % 3600) / 60)}m`}
                    icon={<TimerIcon fontSize="medium" />}
                    color={theme.palette.info.main}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card 
            sx={{ 
              borderRadius: 3,
              height: '100%',
              boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.12)}`,
              background: `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 1)} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
              backdropFilter: 'blur(10px)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography 
                variant="h5" 
                gutterBottom
                sx={{ 
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  mb: 3,
                  color: theme.palette.text.primary,
                  '&:after': {
                    content: '""',
                    display: 'block',
                    height: '2px',
                    background: `linear-gradient(90deg, ${theme.palette.primary.main}, transparent)`,
                    flexGrow: 1,
                    ml: 1
                  }
                }}
              >
                Quick Actions
              </Typography>
              
              <Box display="flex" flexDirection="column" gap={2.5}>
                {/*<ActionButton 
                  icon={<TakeTestIcon />}
                  label="Take a Test"
                  onClick={() => navigate("/tests")}
                  color="primary"
                />*/}
                
                <ActionButton 
                  icon={<CategoryIcon />}
                  label="Browse Tests by Category"
                  onClick={() => navigate("/test-series")}
                  color="secondary"
                />
                
                <ActionButton 
                  icon={<LeaderboardIcon />}
                  label="View Full Leaderboard"
                  onClick={() => navigate("/test-leaderboard")}
                  variant="outlined"
                  color="primary"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Tests */}
        <Grid item xs={12}>
          <Card 
            sx={{ 
              borderRadius: 3,
              boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.12)}`,
              background: `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 1)} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
              backdropFilter: 'blur(10px)'
            }}
          >
            <CardContent>
              <Typography 
                variant="h5" 
                gutterBottom
                sx={{ 
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  mb: 3,
                  color: theme.palette.text.primary,
                  '&:after': {
                    content: '""',
                    display: 'block',
                    height: '2px',
                    background: `linear-gradient(90deg, ${theme.palette.primary.main}, transparent)`,
                    flexGrow: 1,
                    ml: 1
                  }
                }}
              >
                Recent Tests
              </Typography>
              
              {stats.recentTests && stats.recentTests.length > 0 ? (
                <TableContainer sx={{ borderRadius: 2, overflow: 'hidden' }}>
                  <Table size="medium">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                        <TableCell sx={{ fontWeight: 600 }}>Test Name</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>Score</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>Status</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Date</TableCell>
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
                          sx={{ 
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.05),
                              boxShadow: `inset 0 0 0 1px ${alpha(theme.palette.primary.main, 0.1)}`
                            }
                          }}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="body2" fontWeight={500}>{test.title}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              size="small" 
                              label={test.subject} 
                              sx={{ 
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                color: theme.palette.primary.dark,
                                fontWeight: 500,
                                borderRadius: '4px'
                              }} 
                            />
                          </TableCell>
                          <TableCell align="center">
                            {test.status === 'completed' ? (
                              <>
                                <Typography 
                                  variant="body2" 
                                  fontWeight={600} 
                                  sx={{ 
                                    color: test.passed ? theme.palette.success.main : theme.palette.error.main 
                                  }}
                                >
                                  {`${test.score.toFixed(0)}%`}
                                </Typography>
                                {test.totalMarks > 0 ? (
                                  <Typography variant="caption" display="block" color="text.secondary">
                                    {test.scoreRaw}/{test.totalMarks} Marks
                                  </Typography>
                                ) : test.correctAnswers && test.totalQuestions ? (
                                  <Typography variant="caption" display="block" color="text.secondary">
                                    ({test.correctAnswers}/{test.totalQuestions} pts)
                                  </Typography>
                                ) : null}
                              </>
                            ) : (
                              <Chip 
                                size="small" 
                                label="In Progress" 
                                sx={{ 
                                  bgcolor: alpha(theme.palette.warning.main, 0.1),
                                  color: theme.palette.warning.dark
                                }} 
                              />
                            )}
                          </TableCell>
                          <TableCell align="center">
                            {test.status === 'completed' ? (
                              <Chip 
                                size="small"
                                label={test.passed ? "Passed" : "Failed"}
                                color={test.passed ? "success" : "error"}
                                sx={{ 
                                  fontWeight: 500,
                                  borderRadius: '4px',
                                  boxShadow: `0 2px 5px ${alpha(test.passed ? theme.palette.success.main : theme.palette.error.main, 0.2)}`
                                }}
                              />
                            ) : (
                              <Chip 
                                size="small"
                                label={test.status === 'in_progress' ? "In Progress" : test.status}
                                color="warning"
                                sx={{ 
                                  fontWeight: 500,
                                  borderRadius: '4px',
                                  boxShadow: `0 2px 5px ${alpha(theme.palette.warning.main, 0.2)}`
                                }}
                              />
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" color="text.secondary">
                              {formatDate(test.completedAt)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box 
                  sx={{
                    py: 5,
                    textAlign: 'center',
                    bgcolor: alpha(theme.palette.background.default, 0.5),
                    borderRadius: 2
                  }}
                >
                  <Typography variant="body1" color="text.secondary">
                    No recent tests to display
                  </Typography>
                  <Button 
                    variant="outlined" 
                    color="primary"
                    sx={{ mt: 2 }}
                    onClick={() => navigate("/tests")}
                  >
                    Take your first test
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
