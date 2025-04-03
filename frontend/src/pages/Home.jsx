import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  useTheme,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  School as SchoolIcon,
  Assessment as AssessmentIcon,
  EmojiEvents as EmojiEventsIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';

const features = [
  {
    icon: <SchoolIcon sx={{ fontSize: 40 }} />,
    title: 'Comprehensive Test Series',
    description: 'Access a wide range of tests covering various subjects and topics.',
  },
  {
    icon: <AssessmentIcon sx={{ fontSize: 40 }} />,
    title: 'Detailed Analysis',
    description: 'Get instant feedback and detailed performance analysis after each test.',
  },
  {
    icon: <EmojiEventsIcon sx={{ fontSize: 40 }} />,
    title: 'Competitive Spirit',
    description: 'Compete with peers and track your progress on the leaderboard.',
  },
  {
    icon: <NotificationsIcon sx={{ fontSize: 40 }} />,
    title: 'Smart Notifications',
    description: 'Receive timely reminders for upcoming tests and results.',
  },
];

const Home = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <div>
  <Box sx={{ minHeight: '100vh' }}>
    {/* Hero Section */}
    <Box
      sx={{
        bgcolor: theme.palette.primary.main,
        color: 'white',
        py: { xs: 6, md: 10 },
        textAlign: 'center',
        minHeight: '50vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Container maxWidth="md">
        <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Welcome to Test Series
        </Typography>
        <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
          Enhance your learning journey with our comprehensive test series platform
        </Typography>
        <Button
          variant="contained"
          color="secondary"
          size="large"
          sx={{ px: 4, py: 1.5, fontSize: '1.2rem' }}
          onClick={() => navigate('/register')}
        >
          Get Started
        </Button>
      </Container>
    </Box>

    {/* Features Section */}
    <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 }, minHeight: '40vh' }}>
      <Typography
        variant="h3"
        component="h2"
        align="center"
        gutterBottom
        sx={{ mb: 6, fontWeight: 'bold' }}
      >
        Why Choose Us?
      </Typography>
      <Grid container spacing={4}>
        {features.map((feature, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                p: 3,
                transition: 'transform 0.3s ease-in-out',
                '&:hover': { transform: 'scale(1.05)' },
              }}
            >
              <CardContent>
                <Box sx={{ color: theme.palette.primary.main, mb: 2, fontSize: '2rem' }}>
                  {feature.icon}
                </Box>
                <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
                  {feature.title}
                </Typography>
                <Typography color="text.secondary" sx={{ opacity: 0.8 }}>
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>

    {/* CTA Section */}
    <Box
      sx={{
        bgcolor: theme.palette.grey[100],
        py: { xs: 6, md: 10 },
        textAlign: 'center',
        minHeight: '30vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Container maxWidth="md">
        <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
          Ready to Start Your Learning Journey?
        </Typography>
        <Typography variant="body1" sx={{ mb: 4, opacity: 0.9 }}>
          Join thousands of students who are already benefiting from our test series platform.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size="large"
          sx={{ px: 4, py: 1.5, fontSize: '1.2rem' }}
          onClick={() => navigate('/register')}
        >
          Create Account
        </Button>
      </Container>
    </Box>
  </Box>
</div>

  );
};

export default Home; 