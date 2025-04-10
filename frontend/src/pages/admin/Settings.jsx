import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Divider,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../config/api';

const Settings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    defaultTestDuration: 60,
    passingScore: 40,
    maxAttempts: 3,
    allowReview: true,
    showResults: true,
    emailNotifications: true
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setFetching(true);
        const response = await api.get('/api/admin/settings');
        
        // Convert array of settings to object
        const settingsObj = {};
        response.data.forEach(setting => {
          settingsObj[setting.key] = setting.value;
        });
        
        setSettings(prev => ({
          ...prev,
          ...settingsObj
        }));
      } catch (error) {
        console.error('Error fetching settings:', error);
        setError('Failed to load settings');
      } finally {
        setFetching(false);
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Convert settings object to array format expected by API
      const settingsArray = Object.entries(settings).map(([key, value]) => ({
        key,
        value
      }));

      await api.post('/api/admin/settings', { settings: settingsArray });
      setSuccess('Settings updated successfully');
    } catch (error) {
      console.error('Error updating settings:', error);
      setError(error.response?.data?.error || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Admin Settings
      </Typography>

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Test Settings
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Default Test Duration (minutes)"
                name="defaultTestDuration"
                type="number"
                value={settings.defaultTestDuration}
                onChange={handleChange}
                inputProps={{ min: 1 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Default Passing Score (%)"
                name="passingScore"
                type="number"
                value={settings.passingScore}
                onChange={handleChange}
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Maximum Attempts"
                name="maxAttempts"
                type="number"
                value={settings.maxAttempts}
                onChange={handleChange}
                inputProps={{ min: 1 }}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                General Settings
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Allow Test Review</InputLabel>
                <Select
                  name="allowReview"
                  value={settings.allowReview}
                  onChange={handleChange}
                  label="Allow Test Review"
                >
                  <MenuItem value={true}>Yes</MenuItem>
                  <MenuItem value={false}>No</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Show Results Immediately</InputLabel>
                <Select
                  name="showResults"
                  value={settings.showResults}
                  onChange={handleChange}
                  label="Show Results Immediately"
                >
                  <MenuItem value={true}>Yes</MenuItem>
                  <MenuItem value={false}>No</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Email Notifications</InputLabel>
                <Select
                  name="emailNotifications"
                  value={settings.emailNotifications}
                  onChange={handleChange}
                  label="Email Notifications"
                >
                  <MenuItem value={true}>Enabled</MenuItem>
                  <MenuItem value={false}>Disabled</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{ minWidth: 120 }}
                >
                  {loading ? 'Saving...' : 'Save Settings'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
      >
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
      >
        <Alert severity="success" onClose={() => setSuccess('')}>
          {success}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Settings; 