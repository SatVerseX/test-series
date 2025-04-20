import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  Paper,
  useTheme,
  useMediaQuery,
  IconButton,
  Collapse,
  Divider,
  Badge,
  Tooltip,
  Fab,
  SwipeableDrawer,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';

const QuestionNavigator = ({ 
  test, 
  currentSection, 
  currentQuestion, 
  questionStatus = {}, 
  onQuestionClick 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [expanded, setExpanded] = useState(!isMobile);
  const [viewMode, setViewMode] = useState('grid');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  
  // Reset expansion state when mobile breakpoint changes
  useEffect(() => {
    setExpanded(!isMobile);
  }, [isMobile]);
  
  // Get current section questions
  const getSectionQuestions = () => {
    if (!test?.questions || !test?.sections || currentSection >= test?.sections?.length) {
      return [];
    }
    
    return test.questions.filter(
      q => q.sectionTitle === test.sections[currentSection]?.title
    );
  };
  
  const currentSectionQuestions = getSectionQuestions();
  
  // Calculate question statistics
  const getStats = () => {
    if (!test?.questions || !questionStatus) {
      return { total: 0, answered: 0, notVisited: 0, visited: 0, markedForReview: 0 };
    }
    
    let answered = 0;
    let notVisited = 0;
    let visited = 0;
    let markedForReview = 0;
    
    Object.values(questionStatus).forEach(status => {
      switch (status) {
        case 'ANSWERED':
          answered++;
          break;
        case 'NOT_VISITED':
          notVisited++;
          break;
        case 'VISITED':
          visited++;
          break;
        case 'MARKED_FOR_REVIEW':
          markedForReview++;
          break;
      }
    });
    
    const total = test.questions.length;
    
    return { total, answered, notVisited, visited, markedForReview };
  };
  
  const stats = getStats();
  
  const getQuestionStatusColor = (status) => {
    switch (status) {
      case 'ANSWERED':
        return 'success.main';
      case 'MARKED_FOR_REVIEW':
        return 'warning.main';
      case 'VISITED':
        return 'error.light';
      case 'NOT_VISITED':
      default:
        return 'grey.300';
    }
  };

  const getQuestionStatusText = (status) => {
    switch (status) {
      case 'ANSWERED':
        return 'Answered';
      case 'MARKED_FOR_REVIEW':
        return 'Marked for Review';
      case 'VISITED':
        return 'Visited';
      case 'NOT_VISITED':
      default:
        return 'Not Attempted';
    }
  };

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'grid' ? 'list' : 'grid');
  };
  
  const toggleMobileDrawer = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  // Content of the navigator
  const navigatorContent = (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: isMobile ? '100%' : '100%',
      width: isMobile ? '90vw' : '100%',
      maxWidth: isMobile ? '300px' : '100%',
      overflow: 'hidden'
    }}>
      {/* Header with toggle */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 1,
          px: 1,
          pt: isMobile ? 2 : 1
        }}
      >
        <Badge 
          badgeContent={`${stats.answered}/${stats.total}`} 
          color="primary"
          sx={{ 
            '& .MuiBadge-badge': { 
              fontSize: '0.7rem',
              height: 'auto',
              padding: '0 6px'
            } 
          }}
        >
          <Typography variant="subtitle1" fontWeight="medium">
            Questions
          </Typography>
        </Badge>
        
        <Box>
          <Tooltip title={viewMode === 'grid' ? "Switch to List View" : "Switch to Grid View"}>
            <IconButton 
              size="small" 
              onClick={toggleViewMode}
              sx={{ mr: 1 }}
            >
              {viewMode === 'grid' ? <ViewListIcon fontSize="small" /> : <ViewModuleIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          
          {!isMobile && (
            <Tooltip title={expanded ? "Collapse" : "Expand"}>
              <IconButton 
                size="small" 
                onClick={toggleExpanded}
                aria-expanded={expanded}
                aria-label={expanded ? "collapse question navigator" : "expand question navigator"}
              >
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Tooltip>
          )}
          
          {isMobile && (
            <Tooltip title="Close">
              <IconButton 
                size="small" 
                onClick={toggleMobileDrawer}
                aria-label="close question navigator"
              >
                <ExpandLessIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
      
      <Divider />
      
      <Box sx={{ overflow: 'auto', flexGrow: 1, p: 1 }}>
        {/* Status Legend */}
        <Box sx={{ mb: 2 }}>
          <Grid container spacing={1}>
            {['ANSWERED', 'MARKED_FOR_REVIEW', 'VISITED', 'NOT_VISITED'].map((status) => (
              <Grid item xs={6} key={status}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: getQuestionStatusColor(status),
                    }}
                  />
                  <Typography variant="caption">
                    {getQuestionStatusText(status)}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Question Grid or List based on viewMode */}
        {viewMode === 'grid' ? (
          <Grid container spacing={1}>
            {currentSectionQuestions.map((question, index) => {
              const isCurrent = currentQuestion === index;
              const status = questionStatus[question._id] || 'NOT_VISITED';
              
              return (
                <Grid item xs={isMobile ? 3 : 4} key={question._id}>
                  <Button
                    variant={isCurrent ? "contained" : "outlined"}
                    onClick={() => {
                      onQuestionClick(currentSection, index);
                      if (isMobile) setMobileDrawerOpen(false);
                    }}
                    sx={{
                      minWidth: 'auto',
                      width: '100%',
                      height: '36px',
                      p: 0,
                      borderRadius: 1,
                      borderColor: getQuestionStatusColor(status),
                      bgcolor: isCurrent ? 'primary.main' : 'transparent',
                      color: isCurrent ? 'primary.contrastText' : 'text.primary',
                      '&:hover': {
                        bgcolor: isCurrent ? 'primary.dark' : 'action.hover',
                      },
                    }}
                  >
                    {index + 1}
                  </Button>
                </Grid>
              );
            })}
          </Grid>
        ) : (
          // List view for mobile optimization
          <Box sx={{ mt: 1 }}>
            {currentSectionQuestions.map((question, index) => {
              const isCurrent = currentQuestion === index;
              const status = questionStatus[question._id] || 'NOT_VISITED';
              
              return (
                <Box 
                  key={question._id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 1,
                    mb: 1,
                    borderRadius: 1,
                    bgcolor: isCurrent ? 'action.selected' : 'transparent',
                    border: '1px solid',
                    borderColor: isCurrent ? 'primary.main' : 'divider',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    onQuestionClick(currentSection, index);
                    if (isMobile) setMobileDrawerOpen(false);
                  }}
                >
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      bgcolor: isCurrent ? 'primary.main' : getQuestionStatusColor(status),
                      color: isCurrent ? 'white' : 'text.primary',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2,
                      fontSize: '0.8rem'
                    }}
                  >
                    {index + 1}
                  </Box>
                  <Typography variant="body2" sx={{ flexGrow: 1, fontWeight: isCurrent ? 'bold' : 'normal' }}>
                    {question.text?.substring(0, 30)}{question.text?.length > 30 ? '...' : ''}
                  </Typography>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: getQuestionStatusColor(status),
                      ml: 1
                    }}
                  />
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
      
      {/* Always visible mini-stats */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          p: 1,
          borderTop: '1px solid',
          borderColor: 'divider',
          mt: 'auto',
          bgcolor: 'background.paper'
        }}
      >
        <Typography variant="caption">
          Current: <strong>{currentQuestion + 1}</strong> / {currentSectionQuestions.length}
        </Typography>
        <Typography variant="caption">
          Answered: <strong>{stats.answered}</strong> / {stats.total}
        </Typography>
      </Box>
    </Box>
  );

  // For mobile, use SwipeableDrawer
  if (isMobile) {
    return (
      <>
        <SwipeableDrawer
          anchor="right"
          open={mobileDrawerOpen}
          onOpen={() => setMobileDrawerOpen(true)}
          onClose={() => setMobileDrawerOpen(false)}
          swipeAreaWidth={30}
          disableBackdropTransition
          disableDiscovery={false}
        >
          {navigatorContent}
        </SwipeableDrawer>
        
        {/* Floating button for mobile */}
        <Fab
          color="primary"
          size="small"
          aria-label="show questions"
          onClick={toggleMobileDrawer}
          sx={{
            position: 'fixed',
            bottom: 90,
            right: 16,
            zIndex: 1000
          }}
        >
          <Badge 
            badgeContent={`${stats.answered}/${stats.total}`} 
            color="error"
          >
            <VisibilityIcon />
          </Badge>
        </Fab>
      </>
    );
  }
  
  // For desktop, use regular component with collapse
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Collapse in={expanded} collapsedSize={40} orientation="horizontal" sx={{ height: '100%' }}>
        {navigatorContent}
      </Collapse>
    </Box>
  );
};

export default QuestionNavigator; 