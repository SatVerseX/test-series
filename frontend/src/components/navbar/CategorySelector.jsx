import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  ListItemText,
  Tooltip,
  Fade,
  Typography,
  useTheme,
  alpha,
  Chip,
  Badge
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import SchoolIcon from '@mui/icons-material/School';
import ScienceIcon from '@mui/icons-material/Science';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import EngineeringIcon from '@mui/icons-material/Engineering';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import TrainIcon from '@mui/icons-material/Train';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CategoryIcon from '@mui/icons-material/Category';
import { useExamCategory } from '../../contexts/ExamCategoryContext';

// Define hardcoded categories for fallback if API fails
const defaultCategories = [
  { id: 'ssc', name: 'SSC', icon: 'school' },
  { id: 'upsc', name: 'UPSC', icon: 'school' },
  { id: 'jee', name: 'JEE', icon: 'science' },
  { id: 'neet', name: 'NEET', icon: 'medical' },
  { id: 'gate', name: 'GATE', icon: 'engineering' },
  { id: 'banking', name: 'Banking', icon: 'account_balance' },
  { id: 'railway', name: 'Railway', icon: 'train' },
  { id: 'cbse', name: 'CBSE', icon: 'school' }
];

const CategorySelector = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const { categories = [], selectedCategory, selectCategory, loading } = useExamCategory();
  const theme = useTheme();
  
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleCategorySelect = (categoryId) => {
    selectCategory(categoryId);
    handleClose();
  };

  // Get the icon component based on the icon name
  const getIconComponent = (iconName) => {
    switch (iconName) {
      case 'science': return <ScienceIcon />;
      case 'medical': return <MedicalServicesIcon />;
      case 'engineering': return <EngineeringIcon />;
      case 'account_balance': return <AccountBalanceIcon />;
      case 'train': return <TrainIcon />;
      case 'book': return <MenuBookIcon />;
      default: return <SchoolIcon />;
    }
  };

  // Use available categories or fallback to default ones
  const availableCategories = categories.length > 0 
    ? categories.map(cat => typeof cat === 'string' ? { id: cat, name: cat, icon: 'school' } : cat)
    : defaultCategories;

  // Find current category
  const currentCategory = selectedCategory === 'all' 
    ? { id: 'all', name: 'All Exams', icon: 'school' }
    : availableCategories.find(cat => cat.id === selectedCategory) || 
      { id: 'all', name: 'All Exams', icon: 'school' };

  if (loading) {
    return (
      <Chip 
        icon={<CategoryIcon />} 
        label="Loading..." 
        size="small" 
        sx={{ 
          fontWeight: 500, 
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          borderRadius: 2
        }} 
      />
    );
  }

  return (
    <Box>
      <Badge
        color="primary"
        variant="dot"
        invisible={!selectedCategory || selectedCategory === 'all'}
        sx={{ '& .MuiBadge-badge': { top: 8, right: 8 } }}
      >
        <Button
          color="inherit"
          onClick={handleClick}
          endIcon={<KeyboardArrowDownIcon />}
          size="small"
          sx={{
            borderRadius: 2,
            py: 0.5,
            px: 1.5,
            bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.1),
            '&:hover': {
              bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.3 : 0.2),
            },
            display: 'flex',
            alignItems: 'center',
            minWidth: 'auto'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
              {getIconComponent(currentCategory.icon)}
            </ListItemIcon>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 500,
                display: { xs: 'none', sm: 'block' }
              }}
            >
              {currentCategory.name}
            </Typography>
          </Box>
        </Button>
      </Badge>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        TransitionComponent={Fade}
        PaperProps={{
          sx: {
            mt: 1,
            width: 220,
            borderRadius: 2,
            boxShadow: 3,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
          }
        }}
      >
        <MenuItem 
          onClick={() => handleCategorySelect('all')}
          selected={selectedCategory === 'all'}
          sx={{
            borderLeft: selectedCategory === 'all' ? `3px solid ${theme.palette.primary.main}` : 0,
            transition: 'all 0.2s'
          }}
        >
          <ListItemIcon>
            <SchoolIcon />
          </ListItemIcon>
          <ListItemText>All Exams</ListItemText>
        </MenuItem>
        
        {availableCategories.map((category) => (
          <MenuItem 
            key={category.id}
            onClick={() => handleCategorySelect(category.id)}
            selected={selectedCategory === category.id}
            sx={{
              borderLeft: selectedCategory === category.id ? `3px solid ${theme.palette.primary.main}` : 0,
              transition: 'all 0.2s'
            }}
          >
            <ListItemIcon>
              {getIconComponent(category.icon)}
            </ListItemIcon>
            <ListItemText>{category.name}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default CategorySelector; 