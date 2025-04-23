import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Chip
} from '@mui/material';
import {
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Menu as MenuIcon,
  AccessTime as TimeIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';

const TestHeader = ({ 
  title, 
  timeLeft, 
  onToggleDarkMode, 
  onToggleFullScreen,
  onToggleSidebar,
  darkMode 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  // Check if timer is below 5 minutes to add warning
  const isTimeLow = () => {
    const timeParts = timeLeft.split(':');
    if (timeParts.length === 2) {
      const minutes = parseInt(timeParts[0], 10);
      return minutes < 5;
    }
    return false;
  };

  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
    onToggleFullScreen();
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      width: '100%',
      gap: 1,
      flexDirection: isMobile ? 'column' : 'row',
      py: isMobile ? 1.5 : 0
    }}>
      {/* Left section */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: isMobile ? '10px' : 1,
        width: isMobile ? '100%' : 'auto',
        justifyContent: isMobile ? 'flex-start' : 'flex-start',
        pl: isMobile ? 1 : 0,
        pr: isMobile ? 1 : 0
      }}>
        <IconButton
          onClick={onToggleSidebar}
          size={isMobile ? "medium" : "small"}
          sx={{
            mr: isMobile ? '10px' : 0,
            backgroundColor: isMobile ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)'
            }
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography
          variant={isMobile ? "h6" : "h6"}
          sx={{
            fontWeight: 'bold',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: { xs: '220px', sm: '300px', md: '400px' },
            flexGrow: 1,
            ml: isMobile ? 0.5 : 0,
            fontSize: isMobile ? '1.1rem' : undefined
          }}
        >
          {title}
        </Typography>

        {isMobile && (
          <Box sx={{ 
            display: 'flex', 
            gap: 0.5,
            ml: 'auto',
            mr: 1
          }}>
            <Tooltip title={darkMode ? "Light Mode" : "Dark Mode"}>
              <IconButton onClick={onToggleDarkMode} color="inherit" size="small">
                {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>

            <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
              <IconButton onClick={handleFullscreenToggle} color="inherit" size="small">
                {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>

      {/* Timer - prominent on mobile */}
      <Chip
        icon={<TimeIcon />}
        label={
          <Typography
            variant={isMobile ? "h6" : "subtitle1"}
            sx={{
              fontWeight: 'bold',
              py: 0.5
            }}
          >
            {timeLeft}
          </Typography>
        }
        color={isTimeLow() ? "error" : "primary"}
        sx={{ 
          width: isMobile ? '100%' : 'auto',
          height: 'auto',
          borderRadius: isMobile ? 1 : 16,
          mt: isMobile ? 1 : 0,
          '& .MuiChip-label': {
            px: 1
          }
        }}
      />

      {/* Controls - hide on mobile as they're shown above */}
      {!isMobile && (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title={darkMode ? "Light Mode" : "Dark Mode"}>
            <IconButton onClick={onToggleDarkMode} color="inherit">
              {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>

          <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
            <IconButton onClick={handleFullscreenToggle} color="inherit">
              {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  );
};

export default TestHeader; 