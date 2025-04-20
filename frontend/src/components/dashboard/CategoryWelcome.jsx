import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardActionArea,
  Avatar,
  Button,
  Checkbox,
  FormControlLabel,
  useTheme,
  Fade,
  Zoom,
  alpha
} from '@mui/material';
import { useExamCategory } from '../../contexts/ExamCategoryContext';
import SchoolIcon from '@mui/icons-material/School';
import ScienceIcon from '@mui/icons-material/Science';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import EngineeringIcon from '@mui/icons-material/Engineering';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import TrainIcon from '@mui/icons-material/Train';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const CategoryWelcome = ({ onComplete }) => {
  const theme = useTheme();
  const { categories, selectCategory, saveDefaultCategory } = useExamCategory();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [setAsDefault, setSetAsDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
  };
  
  const handleContinue = async () => {
    if (!selectedCategory) {
      selectCategory('all');
      onComplete();
      return;
    }
    
    try {
      setSaving(true);
      
      // First select the category
      selectCategory(selectedCategory);
      
      // If user wants to save as default, save it to their profile
      if (setAsDefault) {
        await saveDefaultCategory(selectedCategory);
      }
      
      // Notify parent that we're done
      onComplete();
    } catch (error) {
      console.error('Error saving category preference:', error);
    } finally {
      setSaving(false);
    }
  };
  
  const getIconComponent = (iconName) => {
    switch (iconName) {
      case 'science': return <ScienceIcon fontSize="large" />;
      case 'medical': return <MedicalServicesIcon fontSize="large" />;
      case 'engineering': return <EngineeringIcon fontSize="large" />;
      case 'account_balance': return <AccountBalanceIcon fontSize="large" />;
      case 'train': return <TrainIcon fontSize="large" />;
      default: return <SchoolIcon fontSize="large" />;
    }
  };

  // Convert string categories to objects if needed
  const availableCategories = categories.map(cat => {
    if (typeof cat === 'string') {
      return { id: cat, name: cat, icon: 'school' };
    }
    return cat;
  });
  
  return (
    <Fade in={true} timeout={500}>
      <Paper
        elevation={3}
        sx={{
          p: { xs: 3, md: 5 },
          borderRadius: 3,
          maxWidth: 900,
          mx: 'auto',
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.1)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.15)}`
        }}
      >
        <Typography 
          variant="h4" 
          component="h1" 
          align="center"
          sx={{ 
            mb: 1, 
            fontWeight: 'bold',
            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            backgroundClip: 'text',
            textFillColor: 'transparent',
            color: theme.palette.primary.main // Fallback
          }}
        >
          Welcome to Your Exam Portal!
        </Typography>
        
        <Typography 
          variant="h6" 
          align="center" 
          color="text.secondary" 
          sx={{ mb: 4 }}
        >
          Choose your preferred exam category to personalize your experience
        </Typography>

        <Grid container spacing={2} sx={{ mb: 4 }}>
          {/* All exams option */}
          <Grid item xs={6} sm={4} md={3}>
            <Zoom in={true} style={{ transitionDelay: '100ms' }}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: 2,
                  border: selectedCategory === 'all' ? `2px solid ${theme.palette.primary.main}` : '1px solid transparent',
                  boxShadow: selectedCategory === 'all' ? `0 0 15px ${alpha(theme.palette.primary.main, 0.3)}` : 'none',
                  transition: 'all 0.3s ease',
                  bgcolor: selectedCategory === 'all' ? alpha(theme.palette.primary.main, 0.1) : 'background.paper',
                }}
              >
                <CardActionArea
                  sx={{ height: '100%', p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                  onClick={() => handleCategorySelect('all')}
                >
                  <Avatar
                    sx={{
                      bgcolor: theme.palette.primary.main,
                      width: 60,
                      height: 60,
                      mb: 2
                    }}
                  >
                    <SchoolIcon fontSize="large" />
                  </Avatar>
                  <Typography variant="h6" align="center">
                    All Exams
                  </Typography>
                </CardActionArea>
              </Card>
            </Zoom>
          </Grid>
          
          {/* Each category */}
          {availableCategories.map((category, index) => (
            <Grid item xs={6} sm={4} md={3} key={category.id}>
              <Zoom in={true} style={{ transitionDelay: `${(index + 1) * 100}ms` }}>
                <Card
                  sx={{
                    height: '100%',
                    borderRadius: 2,
                    border: selectedCategory === category.id ? `2px solid ${theme.palette.primary.main}` : '1px solid transparent',
                    boxShadow: selectedCategory === category.id ? `0 0 15px ${alpha(theme.palette.primary.main, 0.3)}` : 'none',
                    transition: 'all 0.3s ease',
                    bgcolor: selectedCategory === category.id ? alpha(theme.palette.primary.main, 0.1) : 'background.paper',
                  }}
                >
                  <CardActionArea
                    sx={{ height: '100%', p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                    onClick={() => handleCategorySelect(category.id)}
                  >
                    <Avatar
                      sx={{
                        bgcolor: theme.palette.primary.main,
                        width: 60,
                        height: 60,
                        mb: 2
                      }}
                    >
                      {getIconComponent(category.icon)}
                    </Avatar>
                    <Typography variant="h6" align="center">
                      {category.name}
                    </Typography>
                  </CardActionArea>
                </Card>
              </Zoom>
            </Grid>
          ))}
        </Grid>
        
        <Box 
          sx={{ 
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', sm: 'center' },
            gap: 2
          }}
        >
          <Button
            variant="outlined"
            onClick={() => {
              selectCategory('all');
              onComplete();
            }}
          >
            Skip for Now
          </Button>
          
          <Box 
            sx={{ 
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: 'center',
              gap: 2
            }}
          >
            {selectedCategory && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={setAsDefault}
                    onChange={(e) => setSetAsDefault(e.target.checked)}
                    color="primary"
                  />
                }
                label="Set as default category"
              />
            )}
            
            <Button
              variant="contained"
              color="primary"
              endIcon={<ArrowForwardIcon />}
              onClick={handleContinue}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Continue'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Fade>
  );
};

export default CategoryWelcome; 