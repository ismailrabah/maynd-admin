import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { authRateLimiter, apiRateLimiter } from './middleware/rateLimiter';
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import licensesRoutes from './routes/licenses';
import devicesRoutes from './routes/devices';
import modelsRoutes from './routes/models';
import statsRoutes from './routes/stats';

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(req.method + ' ' + req.originalUrl + ' ' + res.statusCode + ' - ' + duration + 'ms');
  });
  next();
});

// Apply rate limiting
app.use('/api/auth', authRateLimiter, authRoutes);
app.use('/api/', apiRateLimiter);

// Routes
app.use('/api/users', usersRoutes);
app.use('/api/licenses', licensesRoutes);
app.use('/api/devices', devicesRoutes);
app.use('/api/models', modelsRoutes);
app.use('/api/stats', statsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    success: true,
    message: 'Maynd.ma Admin API',
    version: '1.0.0'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Not Found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log('Maynd.ma Admin server running on port ' + PORT);
  console.log('Environment: ' + (process.env.NODE_ENV || 'development'));
});

export default app;