import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Container,
  Box,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
  Grid,
  CircularProgress,
  Card,
  CardContent,
  Alert,
  useTheme,
  alpha
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import { toast } from 'react-hot-toast';

const steps = ['Order Summary', 'Payment Details', 'Confirmation'];

const CheckoutPage = () => {
  const { type, productId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const { user, api } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [product, setProduct] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    upiId: '',
    bank: 'sbi'
  });
  const [processing, setProcessing] = useState(false);
  const [finalAmount, setFinalAmount] = useState(0);

  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoading(true);
      try {
        if (!productId || !type) {
          toast.error('Invalid product information');
          navigate('/');
          return;
        }

        let response;
        try {
          if (type === 'test-series') {
            response = await api.get(`/api/test-series/${productId}`);
          } else if (type === 'test') {
            response = await api.get(`/api/tests/${productId}`);
          } else {
            throw new Error('Invalid product type');
          }
        } catch (productError) {
          console.error('Error fetching product:', productError);
          toast.error('Product not found or could not be loaded');
          navigate('/');
          return;
        }

        if (response.data) {
          setProduct(response.data);
          
          // Check if user has already purchased this product - API may not exist yet
          try {
            const purchasesResponse = await api.get(`/api/users/purchases/${type}`);
            if (purchasesResponse.data) {
              const isPurchased = purchasesResponse.data.some(item => 
                item._id === productId || item.id === productId
              );
              
              if (isPurchased) {
                toast.error('You have already purchased this product');
                navigate(`/${type === 'test-series' ? 'test-series' : 'tests'}`);
                return;
              }
            }
          } catch (purchaseError) {
            console.warn('Purchases API not implemented yet:', purchaseError);
            // Continue with checkout flow even if purchase check fails
            if (purchaseError.response && purchaseError.response.status === 404) {
              toast('Purchase history not available. Proceeding with checkout.', {
                icon: '⚠️',
                style: {
                  borderRadius: '10px',
                  background: '#FFF3CD',
                  color: '#856404',
                },
              });
            }
          }
          
          // Calculate final price
          const basePrice = response.data.price || 0;
          const discount = response.data.discount || 0;
          const finalPrice = basePrice - (basePrice * discount / 100);
          
          setFinalAmount(finalPrice);
        } else {
          toast.error('Product not found');
          navigate('/');
        }
      } catch (error) {
        console.error('Error fetching product details:', error);
        toast.error('Failed to load product details');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [productId, type, api, navigate]);

  const handleBack = () => {
    if (activeStep === 0) {
      navigate(-1);
    } else {
      setActiveStep((prevStep) => prevStep - 1);
    }
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handlePaymentMethodChange = (event) => {
    setPaymentMethod(event.target.value);
  };

  const handlePaymentDetailChange = (event) => {
    const { name, value } = event.target;
    setPaymentDetails({
      ...paymentDetails,
      [name]: value
    });
  };

  const handleProcessPayment = () => {
    setProcessing(true);
    
    // In a real app, this would make an API call to process payment
    // For now, we'll just simulate a delay and then proceed
    setTimeout(() => {
      setProcessing(false);
      // Move to confirmation step
      setActiveStep(2);
    }, 2000);
  };

  const handleGoToProduct = () => {
    if (type === 'test-series') {
      navigate(`/test-series/${productId}`);
    }
  };

  const getDiscountedPrice = (price, discount) => {
    if (!discount) return price;
    return price - (price * discount / 100);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !product) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || "Product not found"}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} variant="contained">
          Go Back
        </Button>
      </Container>
    );
  }

  const discountedPrice = getDiscountedPrice(product.price, product.discount);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 4, textAlign: 'center' }}>
          Checkout
        </Typography>
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {activeStep === 0 && (
          <Box>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
              Order Summary
            </Typography>
            
            <Card sx={{ mb: 3, border: `1px solid ${theme.palette.divider}` }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  {product.title}
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1">Duration:</Typography>
                  <Typography variant="body1">{product.duration}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1">Number of Tests:</Typography>
                  <Typography variant="body1">{product.totalTests}</Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1">Price:</Typography>
                  <Typography variant="body1">₹{product.price}</Typography>
                </Box>
                
                {product.discount > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body1">Discount ({product.discount}%):</Typography>
                    <Typography variant="body1" color="error.main">-₹{product.price - discountedPrice}</Typography>
                  </Box>
                )}
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Total:</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>₹{discountedPrice}</Typography>
                </Box>
              </CardContent>
            </Card>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
                Back
              </Button>
              <Button variant="contained" onClick={handleNext}>
                Proceed to Payment
              </Button>
            </Box>
          </Box>
        )}
        
        {activeStep === 1 && (
          <Box>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
              Payment Details
            </Typography>
            
            <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold', mb: 3 }}>
              Amount: ₹{discountedPrice}
            </Typography>
            
            <FormControl component="fieldset" sx={{ mb: 3 }}>
              <FormLabel component="legend">Select Payment Method</FormLabel>
              <RadioGroup value={paymentMethod} onChange={handlePaymentMethodChange}>
                <FormControlLabel 
                  value="card" 
                  control={<Radio />} 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CreditCardIcon sx={{ mr: 1 }} />
                      Credit/Debit Card
                    </Box>
                  }
                />
                <FormControlLabel 
                  value="upi" 
                  control={<Radio />} 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PhoneAndroidIcon sx={{ mr: 1 }} />
                      UPI
                    </Box>
                  }
                />
                <FormControlLabel 
                  value="netbanking" 
                  control={<Radio />} 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AccountBalanceIcon sx={{ mr: 1 }} />
                      Net Banking
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>
            
            {paymentMethod === 'card' && (
              <Box>
                <TextField
                  label="Card Number"
                  name="cardNumber"
                  value={paymentDetails.cardNumber}
                  onChange={handlePaymentDetailChange}
                  fullWidth
                  placeholder="1234 5678 9012 3456"
                  sx={{ mb: 2 }}
                />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      label="Expiry Date"
                      name="expiryDate"
                      value={paymentDetails.expiryDate}
                      onChange={handlePaymentDetailChange}
                      fullWidth
                      placeholder="MM/YY"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="CVV"
                      name="cvv"
                      value={paymentDetails.cvv}
                      onChange={handlePaymentDetailChange}
                      fullWidth
                      placeholder="123"
                      type="password"
                    />
                  </Grid>
                </Grid>
              </Box>
            )}
            
            {paymentMethod === 'upi' && (
              <TextField
                label="UPI ID"
                name="upiId"
                value={paymentDetails.upiId}
                onChange={handlePaymentDetailChange}
                fullWidth
                placeholder="yourname@upi"
              />
            )}
            
            {paymentMethod === 'netbanking' && (
              <FormControl fullWidth>
                <FormLabel>Select Bank</FormLabel>
                <RadioGroup
                  name="bank"
                  value={paymentDetails.bank}
                  onChange={handlePaymentDetailChange}
                >
                  <FormControlLabel value="sbi" control={<Radio />} label="State Bank of India" />
                  <FormControlLabel value="hdfc" control={<Radio />} label="HDFC Bank" />
                  <FormControlLabel value="icici" control={<Radio />} label="ICICI Bank" />
                  <FormControlLabel value="axis" control={<Radio />} label="Axis Bank" />
                </RadioGroup>
              </FormControl>
            )}
            
            <Alert severity="info" sx={{ mt: 3, mb: 3 }}>
              This is a demo checkout page. No actual payment will be processed.
            </Alert>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
                Back to Order Summary
              </Button>
              <Button 
                variant="contained" 
                color="primary"
                onClick={handleProcessPayment}
                disabled={processing}
                startIcon={processing ? <CircularProgress size={20} /> : null}
              >
                {processing ? 'Processing...' : 'Pay Now'}
              </Button>
            </Box>
          </Box>
        )}
        
        {activeStep === 2 && (
          <Box sx={{ textAlign: 'center' }}>
            <Box 
              sx={{ 
                width: 80, 
                height: 80, 
                borderRadius: '50%', 
                bgcolor: alpha(theme.palette.success.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                mb: 3
              }}
            >
              <CheckCircleIcon color="success" sx={{ fontSize: 50 }} />
            </Box>
            
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: theme.palette.success.main }}>
              Payment Successful!
            </Typography>
            
            <Typography variant="h6" paragraph>
              Thank you for your purchase
            </Typography>
            
            <Typography variant="body1" paragraph>
              You now have full access to {product.title} for {product.duration}.
            </Typography>
            
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleGoToProduct}
              sx={{ mt: 3 }}
            >
              Start Learning Now
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default CheckoutPage; 