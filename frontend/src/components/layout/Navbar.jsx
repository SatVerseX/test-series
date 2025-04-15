import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Avatar,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
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
  Add as AddIcon,
  Settings as SettingsIcon,
  People as PeopleIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

const Navbar = ({ toggleColorMode, mode }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    console.log('User in Navbar:', user);
    console.log('User role:', user?.role);
    
    // If user is null but localStorage has user data, use that as a fallback
    if (!user) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          console.log('Using stored user data in Navbar:', parsedUser);
          setIsAdmin(parsedUser?.role === 'admin');
          return;
        } catch (error) {
          console.error('Error parsing stored user:', error);
        }
      }
    }
    
    setIsAdmin(user?.role === 'admin');
  }, [user]);

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

  const adminMenuItems = [
    { text: 'Create Test', icon: <AddIcon />, path: '/test/create', requireAdmin: true },
    { text: 'User Management', icon: <PeopleIcon />, path: '/admin/users', requireAdmin: true },
    { text: 'Settings', icon: <SettingsIcon />, path: '/admin/settings', requireAdmin: true },
  ];

  const allMenuItems = isAdmin 
    ? [...menuItems, ...adminMenuItems.filter(item => !item.requireAdmin || isAdmin)] 
    : menuItems;

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

  // Logo SVG component
  const Logo = () => (
    <Box 
      sx={{ 
        display: 'flex', 
        alignItems: 'center',
        gap: 1,
        position: 'relative',
        overflow: 'visible',
        '&:hover .logo-glow': {
          opacity: 0.9,
          transform: 'scale(1.2) rotate(10deg)',
        },
        '&:hover .logo-particles': {
          opacity: 1,
        }
      }}
    >
      <Box
        className="logo-glow"
        sx={{
          position: 'absolute',
          width: '120%',
          height: '120%',
          background: `radial-gradient(circle, ${theme.palette.primary.light} 0%, transparent 70%)`,
          filter: 'blur(15px)',
          opacity: 0.4,
          transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: 'scale(1) rotate(0deg)',
          zIndex: 0,
          animation: 'breathe 3s infinite ease-in-out',
          '@keyframes breathe': {
            '0%': { opacity: 0.3, transform: 'scale(0.9)' },
            '50%': { opacity: 0.5, transform: 'scale(1.1)' },
            '100%': { opacity: 0.3, transform: 'scale(0.9)' },
          },
        }}
      />
      {/* Particle effect container */}
      <Box
        className="logo-particles"
        sx={{
          position: 'absolute',
          width: '150%',
          height: '150%',
          pointerEvents: 'none',
          opacity: 0.3,
          transition: 'opacity 0.5s ease',
          zIndex: 1,
        }}
      >
        {/* Multiple particle elements */}
        {[...Array(6)].map((_, i) => (
          <Box
            key={i}
            sx={{
              position: 'absolute',
              width: i % 2 === 0 ? '8px' : '6px',
              height: i % 2 === 0 ? '8px' : '6px',
              borderRadius: '50%',
              backgroundColor: i % 3 === 0 
                ? theme.palette.primary.light 
                : i % 3 === 1 
                  ? theme.palette.secondary.light
                  : theme.palette.primary.main,
              filter: `blur(${i % 2 ? 1 : 0}px)`,
              opacity: 0.7,
              top: `${50 + Math.cos(i * 60) * 30}%`,
              left: `${50 + Math.sin(i * 60) * 30}%`,
              animation: `particle${i} ${3 + i * 0.5}s infinite ease-in-out`,
              '@keyframes particle0': {
                '0%': { transform: 'translate(0, 0) scale(1)', opacity: 0.7 },
                '50%': { transform: 'translate(15px, -15px) scale(1.2)', opacity: 1 },
                '100%': { transform: 'translate(0, 0) scale(1)', opacity: 0.7 },
              },
              '@keyframes particle1': {
                '0%': { transform: 'translate(0, 0) scale(1)', opacity: 0.7 },
                '50%': { transform: 'translate(-20px, -10px) scale(1.4)', opacity: 0.9 },
                '100%': { transform: 'translate(0, 0) scale(1)', opacity: 0.7 },
              },
              '@keyframes particle2': {
                '0%': { transform: 'translate(0, 0) scale(1)', opacity: 0.7 },
                '50%': { transform: 'translate(10px, 20px) scale(1.3)', opacity: 0.8 },
                '100%': { transform: 'translate(0, 0) scale(1)', opacity: 0.7 },
              },
              '@keyframes particle3': {
                '0%': { transform: 'translate(0, 0) scale(1)', opacity: 0.7 },
                '50%': { transform: 'translate(-15px, 15px) scale(1.2)', opacity: 1 },
                '100%': { transform: 'translate(0, 0) scale(1)', opacity: 0.7 },
              },
              '@keyframes particle4': {
                '0%': { transform: 'translate(0, 0) scale(1)', opacity: 0.7 },
                '50%': { transform: 'translate(20px, 10px) scale(1.4)', opacity: 0.9 },
                '100%': { transform: 'translate(0, 0) scale(1)', opacity: 0.7 },
              },
              '@keyframes particle5': {
                '0%': { transform: 'translate(0, 0) scale(1)', opacity: 0.7 },
                '50%': { transform: 'translate(-10px, -20px) scale(1.3)', opacity: 0.8 },
                '100%': { transform: 'translate(0, 0) scale(1)', opacity: 0.7 },
              },
            }}
          />
        ))}
      </Box>
      <SchoolIcon 
        sx={{ 
          fontSize: { xs: 30, sm: 36, md: 42 },
          color: theme.palette.mode === 'dark' 
            ? theme.palette.primary.light 
            : theme.palette.primary.main,
          filter: `drop-shadow(0px 0px 10px ${theme.palette.primary.main})`,
          animation: `pulse 3s infinite ease-in-out, 
                     float 5s infinite ease-in-out, 
                     spin 20s infinite linear`,
          position: 'relative',
          zIndex: 2,
          '@keyframes pulse': {
            '0%': { transform: 'scale(1)', filter: `drop-shadow(0px 0px 5px ${theme.palette.primary.main})` },
            '50%': { transform: 'scale(1.15)', filter: `drop-shadow(0px 0px 20px ${theme.palette.primary.main})` },
            '100%': { transform: 'scale(1)', filter: `drop-shadow(0px 0px 5px ${theme.palette.primary.main})` },
          },
          '@keyframes float': {
            '0%': { transform: 'translateY(0px)' },
            '25%': { transform: 'translateY(-7px) translateX(3px)' },
            '50%': { transform: 'translateY(0px)' },
            '75%': { transform: 'translateY(7px) translateX(-3px)' },
            '100%': { transform: 'translateY(0px)' },
          },
          '@keyframes spin': {
            '0%': { transform: 'rotate(0deg)' },
            '100%': { transform: 'rotate(360deg)' },
          },
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'scale(1.2) rotate(15deg)',
            filter: `drop-shadow(0px 0px 25px ${theme.palette.primary.main})`,
            animationPlayState: 'paused',
          }
        }} 
      />
      <Typography
        variant="h6"
        component="div"
        sx={{
          fontFamily: '"Poppins", sans-serif',
          fontWeight: 800,
          fontSize: { xs: '1.5rem', sm: '1.7rem', md: '2rem' },
          letterSpacing: '0.08em',
          background: `linear-gradient(45deg, 
            ${theme.palette.primary.main} 0%, 
            ${theme.palette.secondary.main} 30%, 
            ${theme.palette.primary.light} 60%,
            ${theme.palette.secondary.light} 100%)`,
          backgroundSize: '300% auto',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: theme.palette.mode === 'dark' 
            ? '0 0 25px rgba(32, 167, 255, 0.4)'
            : '0 0 25px rgba(0, 112, 201, 0.3)',
          position: 'relative',
          zIndex: 2,
          animation: 'shine 4s linear infinite',
          '@keyframes shine': {
            '0%': { backgroundPosition: '0% center' },
            '100%': { backgroundPosition: '300% center' },
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            width: '100%',
            height: '3px',
            bottom: '-6px',
            left: 0,
            background: `linear-gradient(to right, 
              transparent 0%,
              ${theme.palette.primary.main} 20%, 
              ${theme.palette.secondary.main} 50%, 
              ${theme.palette.primary.main} 80%,
              transparent 100%)`,
            borderRadius: '3px',
            transform: 'scaleX(0)',
            transformOrigin: 'center',
            transition: 'transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          },
          '&:hover::after': {
            transform: 'scaleX(1)',
          },
          transition: 'letter-spacing 0.3s ease, transform 0.3s ease',
          '&:hover': {
            letterSpacing: '0.15em',
            transform: 'translateY(-2px)',
          }
        }}
      >
        Vidya
      </Typography>
    </Box>
  );

  const drawer = (
    <Box>
      <Toolbar sx={{ justifyContent: 'center', py: 2 }}>
        <Logo />
      </Toolbar>
      <Divider />
      <List>
        {allMenuItems.map((item) => (
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
        
        <RouterLink 
          to="/" 
          style={{ 
            textDecoration: 'none', 
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Logo />
        </RouterLink>

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
            {allMenuItems.map((item) => (
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
                  {user.displayName?.[0]?.toUpperCase()}
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
        {isAdmin && (
          <MenuItem component={RouterLink} to="/test/create">
            <ListItemIcon>
              <AddIcon fontSize="small" />
            </ListItemIcon>
            Create Test
          </MenuItem>
        )}
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
