// Special CORS middleware for the stats endpoint
const statsEndpointCors = (req, res, next) => {
  // Handle CORS headers for stats endpoint
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://test-series-frontend-one.vercel.app',
    'https://dist-grd853wzy-satish-pals-projects.vercel.app',
    'https://frontend-9mib7iesp-satish-pals-projects.vercel.app',
    'https://frontend-satish-pals-projects.vercel.app',
    'https://vidya-test-series.vercel.app',
    'http://localhost:5173'
  ];
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', 'https://frontend-satish-pals-projects.vercel.app');
  }
  
  // For OPTIONS preflight requests, use the headers from the request
  if (req.method === 'OPTIONS') {
    const requestHeaders = req.headers['access-control-request-headers'];
    if (requestHeaders) {
      res.header('Access-Control-Allow-Headers', requestHeaders);
    } else {
      // Explicitly list all headers we want to allow, including cache-control
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, cache-control, pragma, expires');
    }
    
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400'); // 24 hours - reduce preflight requests
    
    console.log('Stats endpoint CORS preflight response headers:', res.getHeaders());
    return res.status(204).end();
  }
  
  // For non-OPTIONS requests, always set these headers
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, cache-control, pragma, expires');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  next();
};

module.exports = statsEndpointCors; 