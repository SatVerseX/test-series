import React from 'react';
import { 
  Box, 
  Card, 
  CardMedia, 
  CardContent, 
  Typography, 
  Button, 
  Chip, 
  Badge,
  Stack,
  Divider,
  LinearProgress,
  Rating,
  alpha
} from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import QuizIcon from '@mui/icons-material/Quiz';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarIcon from '@mui/icons-material/Star';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useTheme } from '@mui/material/styles';

const TestSeriesCard = ({ 
  series, 
  isPurchased = false, 
  onUnlock, 
  onStart, 
  progress = null, 
  showActions = true,
  delay = 0
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  const isFree = !series.isPaid;
  const hasPurchased = isPurchased;
  const hasDiscount = series.discount > 0;
  const discountedPrice = hasDiscount 
    ? series.price * (1 - series.discount / 100) 
    : series.price;
  
  // Format price with Indian Rupee symbol (₹)
  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(series.price);
  
  const formattedDiscountedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(discountedPrice);
  
  const handleClick = () => {
    navigate(`/test-series/${series._id}`);
  };

  const handleUnlock = (e) => {
    e.stopPropagation();
    onUnlock(series);
  };

  const handleStart = (e) => {
    e.stopPropagation();
    onStart(series);
  };
  
  return (
    <Card
      component={motion.div}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ 
        duration: 0.4, 
        delay, 
        ease: "easeOut" 
      }}
      whileHover={{ 
        y: -10,
        boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
        transition: { duration: 0.3 }
      }}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: 3,
        background: theme.palette.mode === 'dark' 
          ? alpha(theme.palette.background.paper, 0.8)
          : 'white',
        cursor: 'pointer',
        boxShadow: hasPurchased || isFree
          ? `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`
          : `0 8px 24px ${alpha(theme.palette.grey[500], 0.15)}`,
        border: hasPurchased 
          ? `2px solid ${theme.palette.secondary.main}` 
          : isFree 
            ? `2px solid ${theme.palette.success.main}` 
            : `2px solid transparent`,
        position: 'relative',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: '0 16px 40px rgba(0,0,0,0.12)',
        },
      }}
      onClick={handleClick}
    >
      {/* Status Ribbon */}
      {(hasPurchased || isFree || series.popular) && (
        <Box
          sx={{
            position: 'absolute',
            top: 20,
            right: -30,
            transform: 'rotate(45deg)',
            width: 150,
            textAlign: 'center',
            py: 0.5,
            zIndex: 10,
            backgroundColor: hasPurchased 
              ? theme.palette.secondary.main 
              : isFree 
                ? theme.palette.success.main 
                : theme.palette.error.main,
            color: 'white',
            fontWeight: 'bold',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          }}
        >
          {hasPurchased ? 'PURCHASED' : isFree ? 'FREE' : 'POPULAR'}
        </Box>
      )}

      {/* Thumbnail Image */}
      <Box 
        component="div" 
        sx={{
          position: 'relative',
          overflow: 'hidden',
          height: 180,
          bgcolor: 'grey.100'
        }}
      >
        {/* Overlay Gradient */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(0deg, ${theme.palette.background.paper} 0%, rgba(0,0,0,0) 40%)`,
            zIndex: 1
          }}
        />
        
        {/* Lock Icon Overlay */}
        {!hasPurchased && !isFree && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 2
            }}
          >
            <LockIcon 
              sx={{ 
                fontSize: 50, 
                color: 'white', 
                opacity: 0.9 
              }} 
            />
          </Box>
        )}
        
        <CardMedia
          component="img"
          image={series.imageUrl || 'https://via.placeholder.com/340x180?text=Test+Series'}
          alt={series.title}
          sx={{ 
            height: '100%',
            objectFit: 'cover',
            filter: (!hasPurchased && !isFree) ? 'grayscale(30%)' : 'none',
          }}
        />
        
        {/* Category Tag */}
        <Chip
          label={series.category}
          size="small"
          sx={{
            position: 'absolute',
            top: 12,
            left: 12,
            zIndex: 5,
            fontWeight: 'bold',
            backgroundColor: alpha(theme.palette.background.paper, 0.7),
            backdropFilter: 'blur(4px)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        />
        
        {/* Discount Badge */}
        {hasDiscount && !hasPurchased && !isFree && (
          <Badge
            badgeContent={`-${series.discount}%`}
            color="error"
            sx={{
              position: 'absolute',
              bottom: 12,
              right: 12,
              zIndex: 5,
              '& .MuiBadge-badge': {
                fontSize: '0.85rem',
                height: 25,
                minWidth: 40,
                padding: '0 8px',
                fontWeight: 'bold'
              }
            }}
          >
            <LocalOfferIcon sx={{ color: 'white', fontSize: 24 }} />
          </Badge>
        )}
      </Box>

      <CardContent sx={{ py: 2, px: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Title and Rating */}
        <Box sx={{ mb: 1.5 }}>
          <Typography 
            variant="h6" 
            component="h2" 
            sx={{ 
              fontWeight: 700, 
              fontSize: '1.1rem',
              mb: 0.5,
              color: theme.palette.text.primary,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              height: 56,
            }}
          >
            {series.title}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Rating 
              value={series.rating || 4.5} 
              precision={0.5} 
              size="small" 
              readOnly 
              sx={{ mr: 1 }}
            />
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              <PeopleIcon sx={{ fontSize: 16, mr: 0.5 }} />
              {series.students || 0} Students
            </Typography>
          </Box>
        </Box>
        
        <Divider sx={{ my: 1.5 }} />
        
        {/* Stats */}
        <Stack 
          direction="row" 
          spacing={1} 
          justifyContent="space-between" 
          sx={{ mb: 1.5 }} 
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <QuizIcon sx={{ color: theme.palette.primary.main, mr: 0.75, fontSize: 18 }} />
            <Typography variant="body2" color="text.secondary">
              <strong>{series.totalTests || 0}</strong> Tests
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AccessTimeIcon sx={{ color: theme.palette.primary.main, mr: 0.75, fontSize: 18 }} />
            <Typography variant="body2" color="text.secondary">
              {series.duration || 'Unlimited'}
            </Typography>
          </Box>
        </Stack>
        
        {/* Progress bar for purchased series */}
        {hasPurchased && progress && (
          <Box sx={{ mt: 0.5, mb: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Progress
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {progress.testsCompleted} / {series.totalTests} completed
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={series.totalTests > 0 ? (progress.testsCompleted / series.totalTests) * 100 : 0}
              sx={{ 
                height: 8, 
                borderRadius: 1,
                backgroundColor: alpha(theme.palette.secondary.main, 0.2)
              }}
            />
          </Box>
        )}
        
        {/* Description */}
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ 
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            height: 40,
            flexGrow: 1
          }}
        >
          {series.description || 'No description available'}
        </Typography>
        
        {/* Price and Action Button */}
        {showActions && (
          <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              {series.isPaid ? (
                <Stack direction="row" alignItems="center" spacing={1}>
                  {hasDiscount && (
                    <Typography
                      variant="body2"
                      sx={{ 
                        textDecoration: 'line-through',
                        color: theme.palette.text.disabled
                      }}
                    >
                      {formattedPrice}
                    </Typography>
                  )}
                  <Typography
                    variant="h6"
                    sx={{ 
                      fontWeight: 700,
                      color: theme.palette.primary.main
                    }}
                  >
                    {formattedDiscountedPrice}
                  </Typography>
                </Stack>
              ) : (
                <Typography
                  variant="h6"
                  sx={{ 
                    fontWeight: 700,
                    color: theme.palette.success.main 
                  }}
                >
                  Free
                </Typography>
              )}
            </Box>
            
            {hasPurchased ? (
              <Button
                variant="contained"
                color="secondary"
                size="small"
                endIcon={<ArrowForwardIcon />}
                onClick={handleStart}
                sx={{
                  borderRadius: 2,
                  px: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.3)}`,
                  '&:hover': {
                    boxShadow: `0 6px 16px ${alpha(theme.palette.secondary.main, 0.4)}`,
                  }
                }}
              >
                Continue
              </Button>
            ) : isFree ? (
              <Button
                variant="contained"
                color="success"
                size="small"
                endIcon={<ArrowForwardIcon />}
                onClick={handleStart}
                sx={{
                  borderRadius: 2,
                  px: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.3)}`,
                  '&:hover': {
                    boxShadow: `0 6px 16px ${alpha(theme.palette.success.main, 0.4)}`,
                  }
                }}
              >
                Start Now
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                size="small"
                startIcon={<LockOpenIcon />}
                onClick={handleUnlock}
                sx={{
                  borderRadius: 2,
                  px: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                  '&:hover': {
                    boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.4)}`,
                  }
                }}
              >
                Unlock
              </Button>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default TestSeriesCard; 