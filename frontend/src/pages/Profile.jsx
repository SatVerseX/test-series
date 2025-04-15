import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
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
  useTheme
} from '@mui/material';
import {
  Edit as EditIcon,
  Email as EmailIcon,
  School as SchoolIcon,
  Book as BookIcon,
  History as HistoryIcon
} from '@mui/icons-material';

const Profile = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [profile, setProfile] = useState(null);
  const [testHistory, setTestHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    grade: '',
    subjects: ''
  });

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        setError(null);
        const currentUser = auth.currentUser;
        if (!currentUser) {
          throw new Error('No authenticated user');
        }

        const token = await currentUser.getIdToken();
        
        try {
          const response = await api.get(`/api/users/${currentUser.uid}`);
          setProfile(response.data);
          setTestHistory(response.data.testHistory || []);
          setEditForm({
            name: response.data.name,
            grade: response.data.grade || '',
            subjects: response.data.subjects?.join(', ') || ''
          });
        } catch (error) {
          if (error.response?.status === 404) {
            const registerResponse = await api.post('/api/users/auth/google', {
              idToken: token,
              grade: '10th',
              subjects: []
            });
            
            const profileResponse = await api.get(`/api/users/${currentUser.uid}`);
            setProfile(profileResponse.data);
            setTestHistory(profileResponse.data.testHistory || []);
            setEditForm({
              name: profileResponse.data.name,
              grade: profileResponse.data.grade || '',
              subjects: profileResponse.data.subjects?.join(', ') || ''
            });
          } else {
            throw error;
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError(error.response?.data?.error || 'Failed to load profile data');
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user]);

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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Profile Information */}
        <Grid item xs={12} md={4}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 3,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.secondary.main}15)`,
              backdropFilter: 'blur(10px)',
              border: `1px solid ${theme.palette.divider}`
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  bgcolor: theme.palette.primary.main,
                  fontSize: '3rem',
                  mb: 2
                }}
              >
                {profile?.name?.[0]?.toUpperCase()}
              </Avatar>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                {profile?.name}
              </Typography>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={handleEditProfile}
                sx={{ mt: 1 }}
              >
                Edit Profile
              </Button>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <EmailIcon color="action" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1">
                    {profile?.email}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <SchoolIcon color="action" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Grade
                  </Typography>
                  <Typography variant="body1">
                    {profile?.grade || 'Not specified'}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <BookIcon color="action" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Subjects
                  </Typography>
                  <Typography variant="body1">
                    {profile?.subjects?.join(', ') || 'Not specified'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Test History */}
        <Grid item xs={12} md={8}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 3,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.secondary.main}15)`,
              backdropFilter: 'blur(10px)',
              border: `1px solid ${theme.palette.divider}`
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <HistoryIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Test History
              </Typography>
            </Box>

            {testHistory.length === 0 ? (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No test history available
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {testHistory.map((test, index) => (
                  <Paper
                    key={index}
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      border: `1px solid ${theme.palette.divider}`,
                      '&:hover': {
                        bgcolor: theme.palette.action.hover
                      }
                    }}
                  >
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {test.testName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Subject: {test.subject}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Score: {test.score}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Date: {new Date(test.date).toLocaleDateString()}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Edit Profile Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Name"
              name="name"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Grade"
              name="grade"
              value={editForm.grade}
              onChange={(e) => setEditForm({ ...editForm, grade: e.target.value })}
              fullWidth
            />
            <TextField
              label="Subjects (comma-separated)"
              name="subjects"
              value={editForm.subjects}
              onChange={(e) => setEditForm({ ...editForm, subjects: e.target.value })}
              fullWidth
              helperText="Enter subjects separated by commas"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveProfile} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile; 