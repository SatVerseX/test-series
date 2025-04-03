import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Assignment as AssignmentIcon,
  EmojiEvents as EmojiEventsIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

const Navbar = ({ toggleColorMode, mode }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to log out');
    }
    handleClose();
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Tests', icon: <AssignmentIcon />, path: '/tests' },
    { text: 'Leaderboard', icon: <EmojiEventsIcon />, path: '/leaderboard' },
    { text: 'Profile', icon: <PersonIcon />, path: '/profile' },
  ];

  const commonButtonStyles = {
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
    color: 'text.primary',
    fontWeight: 500,
    px: { sm: 1.5, md: 2 },
    py: { sm: 1, md: 1.5 },
    transition: 'background-color 0.3s ease',
  };

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Test Series
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            component={RouterLink}
            to={item.path}
            onClick={handleDrawerToggle}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem button onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <AppBar
      position="static"
      elevation={1}
      sx={{
        bgcolor: 'background.paper',
        color: 'text.primary',
        borderBottom: 1,
        borderColor: 'divider',
        width: '100%',
      }}
    >
      {/* Removed Container to allow full-width coverage */}
      <Toolbar
        disableGutters
        sx={{
          minHeight: { xs: 56, sm: 64, md: 72 },
          py: { xs: 1, sm: 1.5, md: 2 },
          px: { xs: 2, sm: 3, md: 4 },
        }}
      >
        {isMobile && (
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{
            flexGrow: { xs: 1, md: 0 },
            textDecoration: 'none',
            color: 'primary.main',
            fontWeight: 700,
            mr: { md: 6 },
            fontSize: { xs: '1.2rem', sm: '1.3rem', md: '1.5rem' },
          }}
        >
          Test Series
        </Typography>

        {!isMobile && (
          <Box
            sx={{
              flexGrow: 1,
              display: 'flex',
              alignItems: 'center',
              gap: { sm: 1, md: 2 },
              ml: { md: 2 },
            }}
          >
            {menuItems.map((item) => (
              <Button
                key={item.text}
                component={RouterLink}
                to={item.path}
                startIcon={item.icon}
                sx={commonButtonStyles}
              >
                {item.text}
              </Button>
            ))}
          </Box>
        )}

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 1, sm: 2 },
            ml: { xs: 'auto', sm: 2 },
          }}
        >
          <IconButton
            color="inherit"
            onClick={toggleColorMode}
            sx={{
              ...commonButtonStyles,
              p: { xs: 1, sm: 1.5 },
            }}
          >
            {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
          {user ? (
            <Tooltip title="Account settings">
              <IconButton
                onClick={handleMenu}
                size="small"
                sx={{
                  ml: { xs: 1, sm: 2 },
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                  },
                  color: 'text.primary',
                  p: { xs: 1, sm: 1.5 },
                }}
                aria-controls={Boolean(anchorEl) ? 'account-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={Boolean(anchorEl) ? 'true' : undefined}
              >
                <Avatar
                  sx={{
                    width: { xs: 32, sm: 36, md: 40 },
                    height: { xs: 32, sm: 36, md: 40 },
                    bgcolor: 'primary.main',
                    color: 'white',
                    fontSize: { xs: '1rem', sm: '1.2rem' },
                  }}
                >
                  {user.name?.[0]?.toUpperCase()}
                </Avatar>
              </IconButton>
            </Tooltip>
          ) : (
            <Button
              color="primary"
              variant="contained"
              component={RouterLink}
              to="/login"
              sx={{
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
                fontWeight: 500,
                px: { xs: 2, sm: 3 },
                py: { xs: 0.75, sm: 1 },
                transition: 'background-color 0.3s ease',
              }}
            >
              Login
            </Button>
          )}
        </Box>
      </Toolbar>

      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={Boolean(anchorEl)}
        onClose={handleClose}
        onClick={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem component={RouterLink} to="/profile">
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      <Drawer
        variant="temporary"
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 240,
            transition: 'width 0.3s ease',
          },
        }}
      >
        {drawer}
      </Drawer>
    </AppBar>
  );
};

export default Navbar;
