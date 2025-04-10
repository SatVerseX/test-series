import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Box,
  Chip,
  Alert,
  Snackbar,
  useTheme,
  alpha,
  Toolbar,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Checkbox,
  TableSortLabel
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import UserStatsDashboard from './UserStatsDashboard';

const MotionTableRow = motion(TableRow);
const MotionTableCell = motion(TableCell);

const UserManagement = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderBy, setOrderBy] = useState('name');
  const [order, setOrder] = useState('asc');
  const [selected, setSelected] = useState([]);
  const [expandedUser, setExpandedUser] = useState(null);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/users');
      setUsers(response.data);
      setError('');
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error.response?.data?.error || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      setLoading(true);
      setError(null);

      console.log('Updating role for user:', userId, 'to:', newRole);

      // Find the user in the current users list
      const userToUpdate = users.find(user => user._id === userId);
      if (!userToUpdate) {
        throw new Error('User not found');
      }

      const response = await api.patch(`/api/users/${userId}/role`, { role: newRole });
      
      console.log('Role update response:', response.data);

      // Update local state using _id instead of firebaseId
      setUsers(users.map(user => 
        user._id === userId 
          ? { ...user, role: newRole }
          : user
      ));

      // Show success message
      setSuccess(`User ${userToUpdate.name}'s role updated to ${newRole}`);
      setTimeout(() => setSuccess(null), 3000);

    } catch (error) {
      console.error('Error updating user role:', error);
      
      // Get detailed error message
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update user role';
      setError(errorMessage);
      
      // Show error message for 5 seconds
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkRoleChange = async (newRole) => {
    try {
      setLoading(true);
      setError(null);

      console.log('Updating roles for users:', selected, 'to:', newRole);

      // Update roles for all selected users
      const updatePromises = selected.map(userId => {
        const userToUpdate = users.find(user => user._id === userId);
        if (!userToUpdate) {
          throw new Error(`User with ID ${userId} not found`);
        }
        return api.patch(`/api/users/${userId}/role`, { role: newRole });
      });

      // Wait for all updates to complete
      await Promise.all(updatePromises);

      // Update local state for all selected users
      setUsers(users.map(user => 
        selected.includes(user._id)
          ? { ...user, role: newRole }
          : user
      ));

      // Show success message
      setSuccess(`Updated role to ${newRole} for ${selected.length} users`);
      setTimeout(() => setSuccess(null), 3000);

      // Clear selection
      setSelected([]);

    } catch (error) {
      console.error('Error updating user roles:', error);
      
      // Get detailed error message
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update user roles';
      setError(errorMessage);
      
      // Show error message for 5 seconds
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return {
          bg: 'linear-gradient(45deg, #FF416C, #FF4B2B)',
          color: 'white'
        };
      case 'teacher':
        return {
          bg: 'linear-gradient(45deg, #2196F3, #21CBF3)',
          color: 'white'
        };
      case 'student':
        return {
          bg: 'linear-gradient(45deg, #4CAF50, #8BC34A)',
          color: 'white'
        };
      default:
        return {
          bg: theme.palette.grey[200],
          color: theme.palette.text.primary
        };
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <AdminPanelSettingsIcon />;
      case 'teacher':
        return <SchoolIcon />;
      case 'student':
        return <PersonIcon />;
      default:
        return null;
    }
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      setSelected(users.map(user => user._id));
    } else {
      setSelected([]);
    }
  };

  const handleClick = (id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }
    setSelected(newSelected);
  };

  

  const handleExpandUser = (user) => {
    setExpandedUser(expandedUser?._id === user._id ? null : user);
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.grade?.toString().includes(searchQuery) ||
    user.subjects?.some(subject => subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedUsers = filteredUsers.sort((a, b) => {
    const isAsc = order === 'asc';
    switch (orderBy) {
      case 'name':
        return isAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      case 'email':
        return isAsc ? a.email.localeCompare(b.email) : b.email.localeCompare(a.email);
      case 'grade':
        return isAsc 
          ? (a.grade || '').toString().localeCompare((b.grade || '').toString())
          : (b.grade || '').toString().localeCompare((a.grade || '').toString());
      case 'role':
        return isAsc ? a.role.localeCompare(b.role) : b.role.localeCompare(a.role);
      default:
        return 0;
    }
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user || user.role !== 'admin') {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 4 }}>
          You do not have permission to access this page.
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh'
        }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <AdminPanelSettingsIcon sx={{ fontSize: 60, color: theme.palette.primary.main }} />
        </motion.div>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 4,
          borderRadius: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <AdminPanelSettingsIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              User Management
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Manage user roles and permissions
            </Typography>
          </Box>
        </Box>
      </Paper>

      <UserStatsDashboard />

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Toolbar
          sx={{
            pl: { sm: 2 },
            pr: { xs: 1, sm: 1 },
            ...(selected.length > 0 && {
              bgcolor: (theme) =>
                alpha(theme.palette.primary.main, theme.palette.action.activatedOpacity),
            }),
          }}
        >
          {selected.length > 0 ? (
            <Typography
              sx={{ flex: '1 1 100%' }}
              color="inherit"
              variant="subtitle1"
              component="div"
            >
              {selected.length} selected
            </Typography>
          ) : (
            <TextField
              size="small"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          )}

          {selected.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <FormControl size="small">
                <Select
                  value=""
                  displayEmpty
                  onChange={(e) => handleBulkRoleChange(e.target.value)}
                  sx={{ height: '32px' }}
                >
                  <MenuItem value="" disabled>Change Role</MenuItem>
                  <MenuItem value="student">Student</MenuItem>
                  <MenuItem value="teacher">Teacher</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
              <Tooltip title="Delete">
                <IconButton>
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Toolbar>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selected.length > 0 && selected.length < users.length}
                    checked={users.length > 0 && selected.length === users.length}
                    onChange={handleSelectAllClick}
                  />
                </TableCell>
                {[
                  { id: 'name', label: 'Name' },
                  { id: 'email', label: 'Email' },
                  { id: 'grade', label: 'Grade', width: '80px' },
                  { id: 'subjects', label: 'Subjects', width: '180px', sortable: false },
                  { id: 'role', label: 'Role', width: '120px' },
                  { id: 'actions', label: 'Actions', width: '120px', sortable: false }
                ].map((column) => (
                  <TableCell
                    key={column.id}
                    sx={{ 
                      width: column.width,
                      py: 1.5,
                      fontSize: '0.9rem',
                      fontWeight: 'bold'
                    }}
                  >
                    {column.sortable !== false ? (
                      <TableSortLabel
                        active={orderBy === column.id}
                        direction={orderBy === column.id ? order : 'asc'}
                        onClick={() => handleRequestSort(column.id)}
                      >
                        {column.label}
                      </TableSortLabel>
                    ) : (
                      column.label
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              <AnimatePresence>
                {sortedUsers.map((user, index) => {
                  const isSelected = selected.indexOf(user._id) !== -1;
                  const isExpanded = expandedUser?._id === user._id;

                  return (
                    <React.Fragment key={user._id}>
                      <MotionTableRow
                        hover
                        selected={isSelected}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={isSelected}
                            onChange={() => handleClick(user._id)}
                          />
                        </TableCell>
                        <MotionTableCell sx={{ py: 1.5, fontSize: '0.875rem' }}>{user.name}</MotionTableCell>
                        <MotionTableCell sx={{ py: 1.5, fontSize: '0.875rem' }}>{user.email}</MotionTableCell>
                        <MotionTableCell sx={{ py: 1.5, fontSize: '0.875rem' }}>{user.grade || 'N/A'}</MotionTableCell>
                        <MotionTableCell sx={{ py: 1.5 }}>
                          {user.subjects && user.subjects.length > 0 ? (
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              {user.subjects.map((subject) => (
                                <Chip
                                  key={subject}
                                  label={subject}
                                  size="small"
                                  sx={{
                                    background: alpha(theme.palette.primary.main, 0.1),
                                    color: theme.palette.primary.main,
                                    height: '20px',
                                    '& .MuiChip-label': {
                                      px: 0.75,
                                      py: 0,
                                      fontSize: '0.75rem'
                                    }
                                  }}
                                />
                              ))}
                            </Box>
                          ) : (
                            'N/A'
                          )}
                        </MotionTableCell>
                        <MotionTableCell sx={{ py: 1.5 }}>
                          <Chip
                            icon={getRoleIcon(user.role)}
                            label={user.role}
                            sx={{
                              background: getRoleColor(user.role).bg,
                              color: getRoleColor(user.role).color,
                              fontWeight: 'bold',
                              height: '24px',
                              '& .MuiChip-label': {
                                px: 1,
                                fontSize: '0.8rem'
                              },
                              '& .MuiChip-icon': {
                                fontSize: '1rem',
                                ml: 0.5
                              }
                            }}
                          />
                        </MotionTableCell>
                        <MotionTableCell sx={{ py: 1.5 }}>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => handleExpandUser(user)}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit User">
                              <IconButton size="small">
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </MotionTableCell>
                      </MotionTableRow>
                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={7} sx={{ py: 2, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                            <Box sx={{ display: 'flex', gap: 4, px: 2 }}>
                              <Box>
                                <Typography variant="subtitle2" color="primary" gutterBottom>
                                  User Details
                                </Typography>
                                <Typography variant="body2">Email: {user.email}</Typography>
                                <Typography variant="body2">Phone: {user.phoneNumber || 'N/A'}</Typography>
                                <Typography variant="body2">Grade: {user.grade || 'N/A'}</Typography>
                                <Typography variant="body2">Subjects: {user.subjects?.join(', ') || 'N/A'}</Typography>
                              </Box>
                              <Box>
                                <Typography variant="subtitle2" color="primary" gutterBottom>
                                  Activity Stats
                                </Typography>
                                <Typography variant="body2">Tests Taken: {user.testHistory?.length || 0}</Typography>
                                <Typography variant="body2">Created Tests: {user.createdTests?.length || 0}</Typography>
                                <Typography variant="body2">Login Count: {user.loginCount || 0}</Typography>
                                <Typography variant="body2">
                                  Last Active: {formatDate(user.lastActive)}
                                </Typography>
                                <Typography variant="body2">
                                  Joined: {formatDate(user.createdAt)}
                                </Typography>
                              </Box>
                              <Box>
                                <Typography variant="subtitle2" color="primary" gutterBottom>
                                  Role Management
                                </Typography>
                                <FormControl size="small" sx={{ minWidth: 120 }}>
                                  <Select
                                    value={user.role}
                                    onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                    sx={{ height: '32px' }}
                                  >
                                    <MenuItem value="student">Student</MenuItem>
                                    <MenuItem value="teacher">Teacher</MenuItem>
                                    <MenuItem value="admin">Admin</MenuItem>
                                  </Select>
                                </FormControl>
                              </Box>
                            </Box>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </AnimatePresence>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        sx={{ mb: 2, mr: 2 }}
      >
        <Alert
          severity="error"
          onClose={() => setError('')}
          icon={<ErrorIcon />}
          sx={{
            background: 'linear-gradient(45deg, #FF416C, #FF4B2B)',
            color: 'white',
            '& .MuiAlert-icon': { color: 'white' },
            py: 1.5,
            px: 3
          }}
        >
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        sx={{ mb: 2, mr: 2 }}
      >
        <Alert
          severity="success"
          onClose={() => setSuccess('')}
          icon={<CheckCircleIcon />}
          sx={{
            background: 'linear-gradient(45deg, #4CAF50, #8BC34A)',
            color: 'white',
            '& .MuiAlert-icon': { color: 'white' },
            py: 1.5,
            px: 3
          }}
        >
          {success}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default UserManagement; 