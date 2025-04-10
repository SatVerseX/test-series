import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Paper,
  Grid,
  Typography,
  useTheme,
  alpha,
  Card,
  CardContent,
  Divider,
  LinearProgress,
  Alert,
  Tooltip,
  Tab,
  Tabs,
  CircularProgress,
  Skeleton,
  Button
} from '@mui/material';
import {
  PeopleAlt as PeopleIcon,
  School as SchoolIcon,
  AdminPanelSettings as AdminIcon,
  TrendingUp as TrendingUpIcon,
  AccessTime as TimeIcon,
  Assignment as AssignmentIcon,
  Group as GroupIcon,
  Timeline as TimelineIcon,
  Score as ScoreIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { api } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

const StatCard = ({ title, value, icon, color, subtitle }) => {
  const theme = useTheme();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        elevation={0}
        sx={{
          background: `linear-gradient(135deg, ${alpha(color[0], 0.1)}, ${alpha(color[1], 0.1)})`,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          backdropFilter: 'blur(8px)',
          height: '100%'
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${color[0]}, ${color[1]})`,
                mr: 2
              }}
            >
              {icon}
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {title}
            </Typography>
          </Box>
          <Typography variant="h3" sx={{ mb: 1, fontWeight: 'bold' }}>
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const ActivityCard = ({ title, data, icon, color }) => {
  const theme = useTheme();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        elevation={0}
        sx={{
          background: `linear-gradient(135deg, ${alpha(color[0], 0.1)}, ${alpha(color[1], 0.1)})`,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          backdropFilter: 'blur(8px)',
          height: '100%'
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${color[0]}, ${color[1]})`,
                mr: 2
              }}
            >
              {icon}
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {title}
            </Typography>
          </Box>
          <Box sx={{ mt: 2 }}>
            {Object.entries(data).map(([key, value], index) => (
              <Box key={key} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {key.split(/(?=[A-Z])/).join(' ')}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {typeof value === 'number' ? 
                      (key.toLowerCase().includes('rate') ? `${value}%` : value) 
                      : value}
                  </Typography>
                </Box>
                {typeof value === 'number' && (
                  <LinearProgress
                    variant="determinate"
                    value={key.toLowerCase().includes('rate') ? value : (value / Math.max(...Object.values(data)) * 100)}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      '& .MuiLinearProgress-bar': {
                        background: `linear-gradient(90deg, ${color[0]}, ${color[1]})`
                      }
                    }}
                  />
                )}
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const ChartCard = ({ title, data, dataKey, colors, XAxisKey = 'name', tooltipFormatter }) => {
  const theme = useTheme();
  
  return (
    <Card
      elevation={0}
      sx={{
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
        backdropFilter: 'blur(10px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        borderRadius: 2
      }}
    >
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
          {title}
        </Typography>
        <Box sx={{ height: { xs: 200, sm: 300 }, mt: 2 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={alpha(theme.palette.text.primary, 0.1)}
              />
              <XAxis 
                dataKey={XAxisKey} 
                tick={{ fill: theme.palette.text.secondary }}
                tickLine={{ stroke: theme.palette.divider }}
                axisLine={{ stroke: theme.palette.divider }}
              />
              <YAxis 
                tick={{ fill: theme.palette.text.secondary }}
                tickLine={{ stroke: theme.palette.divider }}
                axisLine={{ stroke: theme.palette.divider }}
              />
              <RechartsTooltip 
                formatter={tooltipFormatter || ((value) => [value, 'Count'])}
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 8,
                  boxShadow: theme.shadows[3],
                  color: theme.palette.text.primary
                }}
                labelStyle={{ color: theme.palette.text.primary }}
              />
              <Legend 
                wrapperStyle={{
                  color: theme.palette.text.primary
                }}
              />
              {Array.isArray(dataKey) ? (
                dataKey.map((key, index) => (
                  <Bar 
                    key={key} 
                    dataKey={key} 
                    fill={colors[index]} 
                    radius={[4, 4, 0, 0]}
                  />
                ))
              ) : (
                <Bar 
                  dataKey={dataKey} 
                  fill={colors[0]}
                  radius={[4, 4, 0, 0]}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

const UserStatsDashboard = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: { last24h: 0, lastWeek: 0, lastMonth: 0 },
    newUsers: { today: 0, thisWeek: 0, thisMonth: 0 },
    roleDistribution: { student: 0, teacher: 0, admin: 0 },
    activityStats: {
      totalLogins: 0,
      averageLoginTime: 0,
      testActivity: {
        totalTests: 0,
        averageScore: 0,
        completionRate: 0
      },
      gradeDistribution: {},
      subjectPopularity: {}
    }
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is logged in and is admin
      if (!user) {
        setError('Please login to view statistics');
        return;
      }
      
      if (user.role !== 'admin') {
        setError('You do not have permission to view these statistics');
        return;
      }

      const response = await api.get('/api/users/stats');
      console.log('Stats response:', response.data);
      setStats(response.data);
      setError(null);
      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      console.error('Error fetching stats:', error);
      
      // Handle different error types
      if (error.response?.status === 401) {
        setError('Please login to view statistics');
      } else if (error.response?.status === 403) {
        setError('You do not have permission to view these statistics');
      } else if (error.response?.status === 404) {
        setError('Statistics endpoint not found. Please check server configuration.');
      } else if (error.response?.status >= 500) {
        setError('Server error. Please try again later.');
        
        // Implement retry logic for server errors
        if (retryCount < maxRetries) {
          setRetryCount(prev => prev + 1);
          setTimeout(() => {
            fetchStats();
          }, Math.min(1000 * Math.pow(2, retryCount), 10000)); // Exponential backoff
        }
      } else {
        setError(error.response?.data?.error || 'Failed to fetch statistics');
      }
      
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
        retryCount
      });
    } finally {
      setLoading(false);
    }
  }, [user, retryCount]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Memoize data transformations
  const { gradeData, subjectData } = useMemo(() => ({
    gradeData: Object.entries(stats.activityStats.gradeDistribution)
      .map(([grade, count]) => ({
        grade,
        count
      }))
      .sort((a, b) => a.grade.localeCompare(b.grade)),
    subjectData: Object.entries(stats.activityStats.subjectPopularity)
      .map(([subject, count]) => ({
        subject,
        count
      }))
      .sort((a, b) => b.count - a.count)
  }), [stats.activityStats.gradeDistribution, stats.activityStats.subjectPopularity]);

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          action={
            retryCount < maxRetries && (
              <Button color="inherit" size="small" onClick={fetchStats}>
                Retry
              </Button>
            )
          }
        >
          {error}
          {retryCount > 0 && ` (Retry attempt ${retryCount}/${maxRetries})`}
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Stat Cards Skeletons */}
          {[1, 2, 3].map((item) => (
            <Grid item xs={12} md={4} key={item}>
              <Skeleton 
                variant="rectangular" 
                height={160}
                sx={{ 
                  borderRadius: 2,
                  background: alpha(theme.palette.primary.main, 0.1)
                }}
              />
            </Grid>
          ))}
          
          {/* Activity Cards Skeletons */}
          {[1, 2].map((item) => (
            <Grid item xs={12} md={6} key={`activity-${item}`}>
              <Skeleton 
                variant="rectangular" 
                height={240}
                sx={{ 
                  borderRadius: 2,
                  background: alpha(theme.palette.secondary.main, 0.1)
                }}
              />
            </Grid>
          ))}

          {/* Charts Skeletons */}
          {[1, 2].map((item) => (
            <Grid item xs={12} key={`chart-${item}`}>
              <Skeleton 
                variant="rectangular" 
                height={400}
                sx={{ 
                  borderRadius: 2,
                  background: alpha(theme.palette.info.main, 0.1)
                }}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Grid container spacing={3}>
        {/* User Statistics */}
        <Grid item xs={12} md={4}>
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={<PeopleIcon sx={{ color: 'white' }} />}
            color={['#FF416C', '#FF4B2B']}
            subtitle="Total registered users"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Active Users (24h)"
            value={stats.activeUsers.last24h}
            icon={<GroupIcon sx={{ color: 'white' }} />}
            color={['#4CAF50', '#8BC34A']}
            subtitle="Users active in last 24 hours"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Total Logins"
            value={stats.activityStats.totalLogins}
            icon={<TimeIcon sx={{ color: 'white' }} />}
            color={['#2196F3', '#21CBF3']}
            subtitle="Total number of user logins"
          />
        </Grid>

        {/* Activity Statistics */}
        <Grid item xs={12} md={6}>
          <ActivityCard
            title="User Activity"
            data={{
              'Active Last Week': stats.activeUsers.lastWeek,
              'Active Last Month': stats.activeUsers.lastMonth,
              'New This Week': stats.newUsers.thisWeek,
              'New This Month': stats.newUsers.thisMonth,
              'Total Logins': stats.activityStats.totalLogins,
              'Avg Login Time': `${stats.activityStats.averageLoginTime} min`
            }}
            icon={<TrendingUpIcon sx={{ color: 'white' }} />}
            color={['#FF9800', '#F57C00']}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <ActivityCard
            title="Test Activity"
            data={{
              'Total Tests': stats.activityStats.testActivity.totalTests,
              'Average Score': stats.activityStats.testActivity.averageScore,
              'Completion Rate': stats.activityStats.testActivity.completionRate
            }}
            icon={<AssignmentIcon sx={{ color: 'white' }} />}
            color={['#9C27B0', '#673AB7']}
          />
        </Grid>

        {/* Role Distribution */}
        <Grid item xs={12} md={6}>
          <ActivityCard
            title="Role Distribution"
            data={stats.roleDistribution}
            icon={<AdminIcon sx={{ color: 'white' }} />}
            color={['#3F51B5', '#2196F3']}
          />
        </Grid>

        {/* Grade Distribution Chart */}
        <Grid item xs={12}>
          <ChartCard
            title="Grade Distribution"
            data={gradeData}
            dataKey="count"
            XAxisKey="grade"
            colors={[theme.palette.primary.main]}
            tooltipFormatter={(value, name, props) => [`${value} Students`, `Grade ${props.payload.grade}`]}
          />
        </Grid>

        {/* Subject Popularity Chart */}
        <Grid item xs={12}>
          <ChartCard
            title="Subject Popularity"
            data={subjectData}
            dataKey="count"
            XAxisKey="subject"
            colors={[theme.palette.secondary.main]}
            tooltipFormatter={(value, name, props) => [`${value} Students`, props.payload.subject]}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserStatsDashboard; 