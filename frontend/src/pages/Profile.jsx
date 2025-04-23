import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useExamCategory } from '../contexts/ExamCategoryContext';
import { toast } from 'react-toastify';
import { auth } from '../config/firebase';
import api from '../config/api';
import {
  Container,
  Typography,
  Box,
  Paper,
  Avatar,
  Button,
  Grid,
  Divider,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Card,
  CardContent,
  Badge,
  Stack,
  Tabs,
  Tab,
  styled,
  alpha
} from '@mui/material';
import {
  Edit as EditIcon,
  Email as EmailIcon,
  School as SchoolIcon,
  Book as BookIcon,
  History as HistoryIcon,
  Category as CategoryIcon,
  Save as SaveIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  ArrowForward as ArrowForwardIcon,
  Star as StarIcon,
  AccountCircle as AccountCircleIcon,
  Dashboard as DashboardIcon,
  ShoppingCart as ShoppingCartIcon,
  Settings as SettingsIcon,
  VerifiedUser as VerifiedUserIcon,
  TrendingUp as TrendingUpIcon,
  Bookmark as BookmarkIcon
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { LinearProgress } from '@mui/material';
import axios from 'axios';

// Styled components for premium UI
const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: '#44b700',
    color: '#44b700',
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: 'ripple 1.2s infinite ease-in-out',
      border: '1px solid currentColor',
      content: '""',
    },
  },
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(.8)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(2.4)',
      opacity: 0,
    },
  },
}));

const GradientCard = styled(Paper)(({ theme }) => ({
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.03)} 0%, ${alpha(theme.palette.primary.dark, 0.07)} 100%)`,
  borderRadius: 24,
  padding: theme.spacing(3.5),
  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.06)',
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.07)}`,
  transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 15px 50px rgba(0, 0, 0, 0.1)',
    borderColor: alpha(theme.palette.primary.main, 0.15),
  }
}));

const StatCard = styled(Paper)(({ theme, color = 'primary' }) => {
  const colorMap = {
    primary: theme.palette.primary.main,
    success: theme.palette.success.main,
    warning: theme.palette.warning.main,
    error: theme.palette.error.main,
    info: theme.palette.info.main,
  };
  
  const selectedColor = colorMap[color] || colorMap.primary;
  
  return {
    background: `linear-gradient(135deg, ${alpha(selectedColor, 0.04)} 0%, ${alpha(selectedColor, 0.1)} 100%)`,
    borderRadius: 20,
    padding: theme.spacing(2.5),
    boxShadow: `0 8px 32px ${alpha(selectedColor, 0.07)}`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    border: `1px solid ${alpha(selectedColor, 0.08)}`,
    overflow: 'hidden',
    position: 'relative',
    '&:hover': {
      transform: 'translateY(-5px) scale(1.02)',
      boxShadow: `0 12px 40px ${alpha(selectedColor, 0.12)}`,
      '& .MuiSvgIcon-root': {
        transform: 'scale(1.1) rotate(5deg)',
      }
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      top: 0,
      right: 0,
      width: 80,
      height: 80,
      background: `radial-gradient(circle, ${alpha(selectedColor, 0.16)} 0%, transparent 70%)`,
      borderRadius: '0 0 0 100%',
      opacity: 0.5,
    }
  };
});

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  width: 130,
  height: 130,
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
  border: `4px solid ${alpha(theme.palette.background.paper, 0.9)}`,
  margin: '0 auto',
  backgroundColor: theme.palette.primary.main,
  transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  '&:hover': {
    transform: 'scale(1.05) rotate(5deg)',
  }
}));

const ProfileTabs = styled(Tabs)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  borderRadius: 16,
  padding: theme.spacing(1, 1.2),
  background: alpha(theme.palette.background.paper, 0.8),
  backdropFilter: 'blur(10px)',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
  '& .MuiTab-root': {
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '0.95rem',
    borderRadius: 12,
    margin: '4px',
    minHeight: '48px',
    transition: 'all 0.3s ease',
    opacity: 0.7,
  },
  '& .Mui-selected': {
    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.main, 0.16)} 100%)`,
    color: theme.palette.primary.main,
    opacity: 1,
  },
}));

const VerifiedBadge = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.dark, 0.2)} 100%)`,
  color: theme.palette.success.dark,
  borderRadius: 30,
  padding: '4px 12px',
  fontSize: '0.75rem',
  fontWeight: 700,
  marginLeft: theme.spacing(1),
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
}));

const RankChip = styled(Chip)(({ theme, rank }) => {
  // Different colors based on rank
  const rankColors = {
    Beginner: theme.palette.info.main,
    Novice: theme.palette.info.dark,
    Intermediate: theme.palette.warning.main,
    Advanced: theme.palette.error.main,
    Expert: theme.palette.error.dark,
  };
  
  const color = rankColors[rank] || theme.palette.primary.main;
  
  return {
    backgroundColor: alpha(color, 0.15),
    color: color,
    fontWeight: 700,
    border: `1px solid ${alpha(color, 0.3)}`,
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
    '&:hover': {
      backgroundColor: alpha(color, 0.25),
    }
  };
});

// Additional premium styled components
const GlowOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  width: '100%',
  height: '100%',
  top: 0,
  left: 0,
  background: 'radial-gradient(circle at 30% 45%, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 30%)',
  pointerEvents: 'none',
  zIndex: 2
}));

const ShimmerBox = styled(Box)(({ theme }) => ({
  position: 'absolute',
  width: '150%',
  height: '400%',
  background: 'linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 100%)',
  transform: 'rotate(30deg) translateY(-100px) translateX(-300px)',
  animation: 'shimmer 8s infinite linear',
  '@keyframes shimmer': {
    '0%': {
      transform: 'rotate(30deg) translateY(-100px) translateX(-300px)',
    },
    '100%': {
      transform: 'rotate(30deg) translateY(-100px) translateX(300px)',
    },
  },
  zIndex: 0,
  opacity: 0.6,
}));

const IconWrapper = styled(Box)(({ theme, color = 'primary' }) => {
  const colorMap = {
    primary: theme.palette.primary.main,
    success: theme.palette.success.main,
    warning: theme.palette.warning.main,
    error: theme.palette.error.main,
    info: theme.palette.info.main,
  };
  
  const selectedColor = colorMap[color] || colorMap.primary;
  
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: `linear-gradient(135deg, ${alpha(selectedColor, 0.1)} 0%, ${alpha(selectedColor, 0.2)} 100%)`,
    marginBottom: theme.spacing(1.5),
    transition: 'all 0.3s ease',
  };
});

const Profile = () => {
  const { user } = useAuth();
  const { categories, defaultCategory, saveDefaultCategory, loading: categoryLoading } = useExamCategory();
  const theme = useTheme();
  const [profile, setProfile] = useState(null);
  const [testHistory, setTestHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [editForm, setEditForm] = useState({
    name: '',
    grade: '',
    subjects: ''
  });
  const [purchasedSeries, setPurchasedSeries] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    grade: '',
    subjects: ''
  });
  // New states for premium UI
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState({
    testsCompleted: 0,
    averageScore: 0,
    activeSeries: 0,
    rank: 'Beginner'
  });
  const [loadingPurchases, setLoadingPurchases] = useState(false);
  
  const navigate = useNavigate();

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        setError(null);
        const currentUser = auth.currentUser;
        if (!currentUser) {
          console.error('No authenticated user found');
          setError('Please log in to view your profile');
          setLoading(false);
          return;
        }

        console.log('Fetching profile data for user:', currentUser.uid);
        
        try {
          // First attempt to get user data directly
          console.log('Attempting to fetch user profile...');
          const response = await api.get(`/api/users/${currentUser.uid}`);
          console.log('Profile data received:', response.data);
          
          setProfile(response.data);
          setEditForm({
            name: response.data.name,
            grade: response.data.grade || '',
            subjects: response.data.subjects?.join(', ') || ''
          });
          setFormData({
            name: response.data.name || '',
            email: response.data.email || '',
            phone: response.data.phone || '',
            grade: response.data.grade || '',
            subjects: response.data.subjects || ''
          });
          
          // Now fetch user stats separately which includes test history
          try {
            console.log('Fetching user stats...');
            const statsResponse = await api.get(`/api/users/${currentUser.uid}/stats`);
            console.log('User stats received:', statsResponse.data);
            
            setTestHistory(statsResponse.data.recentTests || []);
            
            // Calculate stats for premium UI
            const testsTaken = statsResponse.data.testsTaken || 0;
            const averageScore = statsResponse.data.averageScore || 0;
            
            setStats({
              testsCompleted: testsTaken,
              averageScore: Math.round(averageScore),
              activeSeries: 0, // Will be updated when we fetch purchased series
              rank: getRankFromScore(averageScore)
            });
          } catch (statsError) {
            console.error('Error fetching user stats:', statsError);
            // Continue with the process even if stats fetch fails
          }
          
        } catch (error) {
          console.error('Error in initial profile fetch:', error);
          
          // If user not found (404), try to register/authenticate with Google
          if (error.response?.status === 404) {
            console.log('User not found, attempting to register with Google...');
            try {
              const token = await currentUser.getIdToken();
              console.log('Got ID token, registering user...');
              
              const registerResponse = await api.post('/api/users/auth/google', {
                idToken: token,
                name: currentUser.displayName || '',
                email: currentUser.email || '',
                photoURL: currentUser.photoURL || '',
                grade: '10th',
                subjects: []
              });
              
              console.log('Registration successful:', registerResponse.data);
              
              // Fetch the profile again after registration
              const profileResponse = await api.get(`/api/users/${currentUser.uid}`);
              console.log('Profile fetched after registration:', profileResponse.data);
              
              setProfile(profileResponse.data);
              
              // Try to fetch stats again after registration
              try {
                const statsResponse = await api.get(`/api/users/${currentUser.uid}/stats`);
                setTestHistory(statsResponse.data.recentTests || []);
                setStats({
                  testsCompleted: statsResponse.data.testsTaken || 0,
                  averageScore: Math.round(statsResponse.data.averageScore || 0),
                  activeSeries: 0,
                  rank: getRankFromScore(statsResponse.data.averageScore || 0)
                });
              } catch (statsError) {
                console.error('Error fetching user stats after registration:', statsError);
                // Continue even if stats fetch fails
              }
              
              setEditForm({
                name: profileResponse.data.name,
                grade: profileResponse.data.grade || '',
                subjects: profileResponse.data.subjects?.join(', ') || ''
              });
              setFormData({
                name: profileResponse.data.name || '',
                email: profileResponse.data.email || '',
                phone: profileResponse.data.phone || '',
                grade: profileResponse.data.grade || '',
                subjects: profileResponse.data.subjects || ''
              });
            } catch (registerError) {
              console.error('Error during registration process:', registerError);
              throw new Error('Failed to register user profile');
            }
          } else {
            console.error('Unhandled error during profile fetch:', error);
            throw error;
          }
        }

        // Fetch purchased test series
        await fetchPurchasedSeries();
      } catch (error) {
        console.error('Fatal error in profile fetching:', error);
        setError(error.response?.data?.error || 'Failed to load profile data. Please try refreshing the page.');
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user]);

  useEffect(() => {
    if (defaultCategory) {
      setSelectedCategory(defaultCategory);
    }
  }, [defaultCategory]);

  const handleEditProfile = () => {
    setEditDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditDialogOpen(false);
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      const response = await api.put(`/api/users/${currentUser.uid}`, {
        ...editForm,
        subjects: editForm.subjects.split(',').map((s) => s.trim()).filter(Boolean),
      });
      setProfile(response.data);
      setTestHistory(response.data.testHistory || []);
      setEditDialogOpen(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.response?.data?.error || 'Failed to update profile');
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCategory = async () => {
    if (!selectedCategory) return;
    
    try {
      setSavingCategory(true);
      const success = await saveDefaultCategory(selectedCategory);
      if (success) {
        toast.success('Default exam category saved successfully');
      } else {
        toast.error('Failed to save default category');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Failed to save default category');
    } finally {
      setSavingCategory(false);
    }
  };

  // Helper function to determine rank based on average score
  const getRankFromScore = (score) => {
    if (score >= 90) return 'Expert';
    if (score >= 75) return 'Advanced';
    if (score >= 60) return 'Intermediate';
    if (score >= 40) return 'Novice';
    return 'Beginner';
  };

  const fetchPurchasedSeries = async () => {
    try {
      setLoadingPurchases(true);
      let allSeries = [];
      
      try {
        // First fetch purchased series
        const purchasedResponse = await api.get('/api/users/purchases/test-series');
        if (purchasedResponse.data) {
          allSeries = [...purchasedResponse.data];
        }
      } catch (purchaseError) {
        console.warn('Purchased series API not implemented or failed:', purchaseError);
        // Continue even if this fails
      }
      
      try {
        // Then fetch subscribed series
        const subscribedResponse = await api.get('/api/users/subscribed/test-series');
        if (subscribedResponse.data) {
          // Add a subscriptionType field to differentiate
          const subscribedSeries = subscribedResponse.data.map(series => ({
            ...series,
            subscriptionType: 'free'
          }));
          allSeries = [...allSeries, ...subscribedSeries];
        }
      } catch (subscriptionError) {
        console.warn('Subscribed series API failed:', subscriptionError);
        // Continue even if this fails
      }
      
      // Set all series in state
      setPurchasedSeries(allSeries);
      
      // Update stats with total number of series
      setStats(prev => ({
        ...prev,
        activeSeries: allSeries.length
      }));
      
    } catch (error) {
      console.error('Error fetching series:', error);
      setPurchasedSeries([]);
      // Update stats with empty data
      setStats(prev => ({
        ...prev,
        activeSeries: 0
      }));
    } finally {
      setLoadingPurchases(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" sx={{ py: 8 }}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
            Loading your profile...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This may take a moment
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert 
          severity="error" 
          sx={{ 
            borderRadius: 2,
            py: 2,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Unable to load profile
            </Typography>
            <Typography variant="body2">
              {error}
            </Typography>
            <Button 
              variant="outlined" 
              color="error" 
              size="small" 
              sx={{ mt: 2 }}
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </Box>
        </Alert>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert 
          severity="warning" 
          sx={{ 
            borderRadius: 2,
            py: 2
          }}
        >
          <Typography variant="h6" sx={{ mb: 1 }}>
            Profile Not Found
          </Typography>
          <Typography variant="body2">
            We couldn't find your profile information. Please try signing in again.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            size="small" 
            sx={{ mt: 2 }}
            onClick={() => navigate('/login')}
          >
            Sign In
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: theme.palette.mode === 'dark' 
        ? `linear-gradient(315deg, ${alpha(theme.palette.background.default, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.9)} 74%)`
        : `linear-gradient(315deg, ${alpha(theme.palette.background.default, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.9)} 74%)`,
      display: 'flex',
      flexDirection: 'column',
      gap: '20vh', // 20% viewport height gap between main sections
    }}>
      {/* Profile Hero Section - with reduced width */}
      <Box 
            sx={{ 
          display: 'flex',
          justifyContent: 'center', // Center the header horizontally
          width: '100%',
          overflow: 'hidden',
        }}
      >
        <Box 
                sx={{
            pt: 6, // Reduced top padding 
            pb: 6, // Reduced bottom padding
            height: '50vh', // Set height to 60% of viewport height
            maxHeight: '400px', // Add maximum height for very large screens
            width: { xs: '100%', sm: '100%', md: '90%', lg: '85%', xl: '80%' }, 
            borderRadius: { xs: 0, md: '0 0 20px 20px' },
            background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 70%, ${alpha(theme.palette.secondary.main, 0.8)} 100%)`,
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center', // Center content vertically
          }}
        >
          {/* Glass overlay */}
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(3px)',
            zIndex: 1,
          }} />
          
          {/* Shimmer effect */}
          <ShimmerBox />
          <GlowOverlay />
          
          <Container  maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { xs: 'center', md: 'flex-start' },
              justifyContent: 'space-between',
              gap: 4
            }}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' }, 
                alignItems: 'center',
                gap: 3
              }}>
                <StyledBadge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  variant="dot"
                >
                  <StyledAvatar src={profile?.photoURL} alt={profile?.name}>
                {profile?.name?.[0]?.toUpperCase()}
                  </StyledAvatar>
                </StyledBadge>
                
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: { xs: 'center', sm: 'flex-start' } 
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h4" component="h1" sx={{ 
                      fontWeight: 800,
                      background: 'linear-gradient(90deg, #FFFFFF 0%, rgba(255,255,255,0.8) 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      textShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    }}>
                {profile?.name}
              </Typography>
                    <VerifiedBadge>
                      <VerifiedUserIcon fontSize="small" sx={{ mr: 0.5 }} />
                      Verified
                    </VerifiedBadge>
                  </Box>
                  
                  <Typography variant="body1" sx={{ mb: 1.5, opacity: 0.8 }}>
                    {profile?.email}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    <RankChip 
                      label={`${stats.rank} Level`} 
                      size="small" 
                      rank={stats.rank}
                      sx={{ 
                        backgroundColor: 'rgba(255,255,255,0.2)', 
                        color: 'white',
                        fontWeight: 600
                      }} 
                    />
                    <Chip 
                      label={`Grade: ${profile?.grade || 'Not set'}`} 
                      size="small" 
                      sx={{ 
                        backgroundColor: 'rgba(255,255,255,0.15)', 
                        color: 'white',
                        fontWeight: 600,
                        backdropFilter: 'blur(5px)',
                      }} 
                    />
                  </Box>
                </Box>
              </Box>
              
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={handleEditProfile}
                sx={{ 
                  backgroundColor: 'rgba(255,255,255,0.15)', 
                  backdropFilter: 'blur(8px)',
                  color: 'white',
                  borderRadius: '14px',
                  padding: '10px 24px',
                  fontWeight: 600,
                  border: '1px solid rgba(255,255,255,0.2)',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.25)', 
                    transform: 'translateY(-2px)',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Edit Profile
              </Button>
            </Box>
          </Container>
          
          {/* Enhanced decorative elements */}
          <Box sx={{ 
            position: 'absolute', 
            top: '-10%', 
            left: '-5%', 
            width: '300px', 
            height: '300px', 
            borderRadius: '50%', 
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
            zIndex: 1
          }} />
          <Box sx={{ 
            position: 'absolute', 
            bottom: '-20%', 
            right: '-5%', 
            width: '400px', 
            height: '400px', 
            borderRadius: '50%', 
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
            zIndex: 1
          }} />
          <Box sx={{ 
            position: 'absolute', 
            top: '20%', 
            right: '15%', 
            width: '100px', 
            height: '100px', 
            borderRadius: '50%', 
            background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%)',
            zIndex: 1
          }} />
          <Box sx={{ 
            position: 'absolute', 
            bottom: '30%', 
            left: '10%', 
            width: '150px', 
            height: '150px', 
            borderRadius: '50%', 
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
            zIndex: 1
          }} />
        </Box>
      </Box>
      
      {/* Content Section - Now a separate section with its own container */}
      <Box sx={{ 
        position: 'relative',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        mt: '-10vh', // Pull up slightly to reduce excessive gap
      }}>
        {/* Stats Section - no negative margin anymore */}
        <Container maxWidth="lg" sx={{ 
          mb: 8, 
          position: 'relative', 
          zIndex: 3,
          px: { xs: 2, sm: 3, md: 3 },
        }}>
          <Grid container spacing={3}>
            <Grid item xs={6} sm={3}>
              <StatCard color="primary">
                <IconWrapper color="primary">
                  <DashboardIcon sx={{ 
                    fontSize: 32, 
                    color: theme.palette.primary.main, 
                    transition: 'transform 0.3s ease',
                  }} />
                </IconWrapper>
                <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.primary.main }}>
                  {stats.testsCompleted}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', fontWeight: 500 }}>
                  Tests Completed
                </Typography>
              </StatCard>
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatCard color="success">
                <IconWrapper color="success">
                  <TrendingUpIcon sx={{ 
                    fontSize: 32, 
                    color: theme.palette.success.main, 
                    transition: 'transform 0.3s ease',
                  }} />
                </IconWrapper>
                <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.success.main }}>
                  {stats.averageScore}%
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', fontWeight: 500 }}>
                  Average Score
                </Typography>
              </StatCard>
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatCard color="warning">
                <IconWrapper color="warning">
                  <BookmarkIcon sx={{ 
                    fontSize: 32, 
                    color: theme.palette.warning.main, 
                    transition: 'transform 0.3s ease',
                  }} />
                </IconWrapper>
                <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.warning.main }}>
                  {stats.activeSeries}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', fontWeight: 500 }}>
                  Active Series
                </Typography>
              </StatCard>
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatCard color={
                stats.rank === 'Expert' ? 'error' :
                stats.rank === 'Advanced' ? 'error' :
                stats.rank === 'Intermediate' ? 'warning' :
                'info'
              }>
                <IconWrapper color={
                  stats.rank === 'Expert' ? 'error' :
                  stats.rank === 'Advanced' ? 'error' :
                  stats.rank === 'Intermediate' ? 'warning' :
                  'info'
                }>
                  <StarIcon sx={{ 
                    fontSize: 32, 
                    color: 
                      stats.rank === 'Expert' ? theme.palette.error.dark :
                      stats.rank === 'Advanced' ? theme.palette.error.main :
                      stats.rank === 'Intermediate' ? theme.palette.warning.main :
                      theme.palette.info.main, 
                    transition: 'transform 0.3s ease',
                  }} />
                </IconWrapper>
                <Typography variant="h4" sx={{ 
                  fontWeight: 800, 
                  color: 
                    stats.rank === 'Expert' ? theme.palette.error.dark :
                    stats.rank === 'Advanced' ? theme.palette.error.main :
                    stats.rank === 'Intermediate' ? theme.palette.warning.main :
                    theme.palette.info.main,
                }}>
                  {stats.rank}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', fontWeight: 500 }}>
                  Current Rank
                </Typography>
              </StatCard>
            </Grid>
          </Grid>
          
          {/* Main Content */}
          <Box sx={{ mt: 8, mb: 6, position: 'relative' }}>
            <ProfileTabs
              value={activeTab}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
              centered
            >
              <Tab 
                icon={<AccountCircleIcon />} 
                label="Overview" 
                iconPosition="start"
              />
              <Tab 
                icon={<AssignmentIcon />} 
                label="Test Series" 
                iconPosition="start"
              />
              <Tab 
                icon={<HistoryIcon />} 
                label="Test History" 
                iconPosition="start"
              />
              <Tab 
                icon={<SettingsIcon />} 
                label="Settings" 
                iconPosition="start"
              />
            </ProfileTabs>
            
            {/* Tab Content */}
            <Box sx={{ mt: 4 }}>
              {/* Overview Tab */}
              {activeTab === 0 && (
                <Grid container spacing={4}>
                  <Grid item xs={12} md={8}>
                    <GradientCard>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center' }}>
                        <PersonIcon sx={{ mr: 1 }} />
                        About Me
                      </Typography>
                      
                      <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                              Full Name
                  </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {profile?.name}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ mb: 3 }}>
                            <Typography variant="body2" color="text.secondary">
                              Email Address
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {profile?.email}
                  </Typography>
                </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                              Grade/Class
                  </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {profile?.grade || 'Not specified'}
                  </Typography>
                </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Subjects
                  </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                              {profile?.subjects?.length > 0 ? (
                                profile.subjects.map((subject, idx) => (
                                  <Chip 
                                    key={idx} 
                                    label={subject} 
                                    size="small" 
                                    color="primary" 
                                    variant="outlined" 
                                  />
                                ))
                              ) : (
                                <Typography variant="body1">Not specified</Typography>
                              )}
                </Box>
              </Box>
        </Grid>
                      </Grid>
                    </GradientCard>
                    
                    <GradientCard sx={{ mt: 4 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center' }}>
                        <CategoryIcon sx={{ mr: 1 }} />
                Exam Category Preferences
              </Typography>
            
            {categoryLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={30} />
              </Box>
            ) : (
              <>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            Set your default exam category to customize your experience.
                          </Typography>
                          
                <Box sx={{ mb: 3 }}>
                  <FormControl fullWidth>
                    <InputLabel id="category-select-label">Default Exam Category</InputLabel>
                    <Select
                      labelId="category-select-label"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      label="Default Exam Category"
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      <MenuItem value="all">All Exams</MenuItem>
                      {categories.map((category) => (
                        <MenuItem key={category.id} value={category.id}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveCategory}
                    disabled={savingCategory || !selectedCategory || selectedCategory === defaultCategory}
                  >
                    {savingCategory ? 'Saving...' : 'Save Preference'}
                  </Button>
                </Box>
              </>
            )}
                    </GradientCard>
        </Grid>

                  <Grid item xs={12} md={4}>
                    <GradientCard>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center' }}>
                        <StarIcon sx={{ mr: 1 }} />
                        Recent Activity
                      </Typography>
                      
                      {testHistory && testHistory.length > 0 ? (
                        <Stack spacing={2}>
                          {testHistory.slice(0, 5).map((test, index) => (
                            <Box 
                              key={index} 
                              sx={{ 
                                p: 2,
                                borderRadius: 2,
                                bgcolor: theme.palette.background.paper,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                              }}
                            >
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                {test.title}
                              </Typography>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                <Chip 
                                  label={`Score: ${test.score}%`} 
                                  size="small" 
                                  color={test.score >= 70 ? "success" : test.score >= 40 ? "warning" : "error"}
                                  variant="outlined"
                                />
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(test.completedAt).toLocaleDateString()}
                                </Typography>
                              </Box>
                            </Box>
                          ))}
                          
                          <Button 
                            component={Link} 
                            to="/test-history" 
                            endIcon={<ArrowForwardIcon />}
                            sx={{ alignSelf: 'flex-end' }}
                          >
                            View all activity
                          </Button>
                        </Stack>
                      ) : (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                          <Typography color="text.secondary" sx={{ mb: 2 }}>
                            No test activity yet
                          </Typography>
                          <Button 
                            component={Link} 
                            to="/tests" 
                            variant="outlined" 
                            endIcon={<ArrowForwardIcon />}
                          >
                            Browse Tests
                          </Button>
                        </Box>
                      )}
                    </GradientCard>
                  </Grid>
                </Grid>
              )}
              
              {/* Test Series Tab */}
              {activeTab === 1 && (
                <GradientCard>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center' }}>
                    <AssignmentIcon sx={{ mr: 1 }} />
                    My Test Series
                  </Typography>
                  
                  {purchasedSeries && purchasedSeries.length > 0 ? (
                    <Grid container spacing={3}>
                      {purchasedSeries.map((series, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                          <Paper
                            elevation={0}
                            sx={{
                              p: 3,
                              borderRadius: 2,
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                              '&:hover': {
                                transform: 'translateY(-5px)',
                                boxShadow: '0 6px 25px rgba(0,0,0,0.1)',
                              }
                            }}
                          >
                            <Box sx={{ 
                              mb: 2, 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'flex-start'
                            }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                {series.title}
                              </Typography>
                              <Box>
                                <Chip 
                                  label={series.category} 
                                  size="small" 
                                  color="primary"
                                  sx={{ fontWeight: 600, mb: 1 }}
                                />
                                {series.subscriptionType === 'free' ? (
                                  <Chip
                                    label="Free"
                                    size="small"
                                    color="success"
                                    sx={{ 
                                      fontWeight: 600, 
                                      ml: 1, 
                                      bgcolor: theme.palette.success.light,
                                      color: theme.palette.success.contrastText
                                    }}
                                  />
                                ) : (
                                  <Chip
                                    label="Premium"
                                    size="small"
                                    sx={{ 
                                      fontWeight: 600, 
                                      ml: 1, 
                                      bgcolor: theme.palette.warning.light,
                                      color: theme.palette.warning.contrastText
                                    }}
                                  />
                                )}
                              </Box>
                            </Box>
                            
                            <Box sx={{ mb: 2, flexGrow: 1 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                  Progress
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {series.completedTests || 0}/{series.totalTests || 10}
                                </Typography>
                              </Box>
                              <LinearProgress 
                                variant="determinate" 
                                value={((series.completedTests || 0) / (series.totalTests || 10)) * 100} 
                                sx={{ 
                                  height: 8, 
                                  borderRadius: 4,
                                }}
                              />
                            </Box>
                            
                            {series.expiresAt && (
                              <Typography variant="caption" color="text.secondary" sx={{ mb: 2 }}>
                                Expires: {new Date(series.expiresAt).toLocaleDateString()}
                              </Typography>
                            )}
                            
                            {series.subscribedAt && (
                              <Typography variant="caption" color="text.secondary" sx={{ mb: 2 }}>
                                Subscribed: {new Date(series.subscribedAt).toLocaleDateString()}
                              </Typography>
                            )}
                            
                            <Button
                              component={Link}
                              to={`/test-series/${series._id}`}
                              variant="contained"
                              color="primary"
                              fullWidth
                            >
                              Continue
                            </Button>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <Typography color="text.secondary" paragraph>
                        You haven't purchased any test series yet.
                      </Typography>
                      <Button
                        component={Link}
                to="/test-series"
                        variant="contained"
                        color="primary"
                        endIcon={<ArrowForwardIcon />}
                      >
                        Browse Test Series
                      </Button>
                    </Box>
                  )}
                </GradientCard>
              )}
              
              {/* Test History Tab */}
              {activeTab === 2 && (
                <GradientCard>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center' }}>
                    <HistoryIcon sx={{ mr: 1 }} />
                    Test History
                  </Typography>
                  
                  {testHistory.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <Typography color="text.secondary" paragraph>
                        No test history available
                      </Typography>
                      <Button
                        component={Link}
                        to="/tests"
                        variant="contained"
                        color="primary"
                        endIcon={<ArrowForwardIcon />}
                      >
                        Take a Test
                      </Button>
                    </Box>
                  ) : (
                    <Box sx={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ 
                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            borderRadius: '8px',
                          }}>
                            <th style={{ 
                              padding: '12px 16px', 
                              textAlign: 'left', 
                              fontWeight: 600,
                              color: theme.palette.text.primary
                            }}>Test Name</th>
                            <th style={{ 
                              padding: '12px 16px', 
                              textAlign: 'left', 
                              fontWeight: 600,
                              color: theme.palette.text.primary
                            }}>Subject</th>
                            <th style={{ 
                              padding: '12px 16px', 
                              textAlign: 'center', 
                              fontWeight: 600,
                              color: theme.palette.text.primary
                            }}>Score</th>
                            <th style={{ 
                              padding: '12px 16px', 
                              textAlign: 'right', 
                              fontWeight: 600,
                              color: theme.palette.text.primary
                            }}>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {testHistory.map((test, index) => (
                            <tr key={index} style={{
                              borderBottom: index === testHistory.length - 1 ? 'none' : `1px solid ${theme.palette.divider}`
                            }}>
                              <td style={{ padding: '16px', fontWeight: 500 }}>
                                {test.title}
                              </td>
                              <td style={{ padding: '16px', color: theme.palette.text.secondary }}>
                                {test.subject}
                              </td>
                              <td style={{ padding: '16px', textAlign: 'center' }}>
                                <Chip 
                                  label={`${test.score}%`} 
                                  size="small" 
                                  color={test.score >= 70 ? "success" : test.score >= 40 ? "warning" : "error"}
                                />
                              </td>
                              <td style={{ padding: '16px', textAlign: 'right', color: theme.palette.text.secondary }}>
                                {new Date(test.completedAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </Box>
                  )}
                </GradientCard>
              )}
              
              {/* Settings Tab */}
              {activeTab === 3 && (
                <GradientCard>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center' }}>
                    <SettingsIcon sx={{ mr: 1 }} />
                    Account Settings
                  </Typography>
                  
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                      Personal Information
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={handleEditProfile}
                    >
                      Edit Information
                    </Button>
                  </Box>
                  
                  <Divider sx={{ my: 3 }} />
                  
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                      Category Preferences
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Your default category is set to: <strong>{defaultCategory || 'None'}</strong>
                    </Typography>
                    <Button
                      variant="outlined"
                      onClick={() => setActiveTab(0)}
                    >
                      Change Preferences
                    </Button>
                  </Box>
                </GradientCard>
              )}
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Edit Profile Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.98)} 100%)`,
            backdropFilter: 'blur(10px)',
          }
        }}
      >
        <DialogTitle sx={{ 
          fontWeight: 700, 
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.dark, 0.1)} 100%)`,
          padding: 3,
        }}>
          Edit Profile
        </DialogTitle>
        <DialogContent sx={{ padding: 3, pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Name"
              name="name"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              fullWidth
              variant="outlined"
              InputProps={{
                sx: {
                  borderRadius: 2,
                }
              }}
            />
            <TextField
              label="Grade"
              name="grade"
              value={editForm.grade}
              onChange={(e) => setEditForm({ ...editForm, grade: e.target.value })}
              fullWidth
              variant="outlined"
              InputProps={{
                sx: {
                  borderRadius: 2,
                }
              }}
            />
            <TextField
              label="Subjects (comma-separated)"
              name="subjects"
              value={editForm.subjects}
              onChange={(e) => setEditForm({ ...editForm, subjects: e.target.value })}
              fullWidth
              variant="outlined"
              multiline
              rows={2}
              helperText="Enter subjects separated by commas"
              InputProps={{
                sx: {
                  borderRadius: 2,
                }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ padding: 3, pt: 1 }}>
          <Button 
            onClick={handleCloseDialog}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              padding: '8px 16px',
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveProfile} 
            variant="contained"
            startIcon={<SaveIcon />}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              padding: '8px 20px',
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
  );
};

export default Profile; 