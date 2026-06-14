const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

// Load environment variables
dotenv.config();

// Connect to MongoDB Atlas
connectDB();

const app = express();

// Security Middleware (configured to allow cross-origin resource sharing for static files/images)
app.use(helmet({
  crossOriginResourcePolicy: false // Allows images to be fetched from the client side without CORS blocks
}));

// Logging Middleware
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Enable CORS with dynamic multi-origin client support
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000'
];
if (process.env.CLIENT_URL) {
  process.env.CLIENT_URL.split(',').forEach(url => allowedOrigins.push(url.trim()));
}

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    // Allow if exact match, ends with .vercel.app, prefix match, or wildcard
    const isAllowed = allowedOrigins.includes(origin) ||
                      origin.endsWith('.vercel.app') ||
                      allowedOrigins.some(o => o !== '*' && origin.startsWith(o)) ||
                      allowedOrigins.includes('*');
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(null, false); // Simply omit headers to reject rather than crash the server
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'ConnectHub Social API Server is running smoothly',
    timestamp: new Date()
  });
});

// Application Routes
app.get('/', (req, res) => {
  res.status(200).send('ConnectHub API Server is running successfully');
});
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
