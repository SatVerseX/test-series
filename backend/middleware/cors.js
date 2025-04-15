// Update the CORS middleware to handle credentials properly
const corsMiddleware = (req, res, next) => {
  const allowedOrigins = [
    'https://test-series-frontend-one.vercel.app',
    'https://dist-grd853wzy-satish-pals-projects.vercel.app',
    'https://frontend-9mib7iesp-satish-pals-projects.vercel.app',
    'https://frontend-satish-pals-projects.vercel.app',
    'http://localhost:5173'
  ];
  
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    // Default to main frontend in production
    res.setHeader('Access-Control-Allow-Origin', 'https://frontend-satish-pals-projects.vercel.app');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  next();
};

module.exports = corsMiddleware; 