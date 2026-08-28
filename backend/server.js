require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const portalRoutes = require('./routes/portalRoutes');
const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

const configuredOrigins = (process.env.FRONTEND_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (process.env.NODE_ENV === 'production' && configuredOrigins.length === 0) {
  throw new Error('FRONTEND_ORIGINS or FRONTEND_URL must be configured in production.');
}

app.set('trust proxy', process.env.NODE_ENV === 'production' ? 1 : false);
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin(origin, callback) {
    if (!origin || configuredOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin not allowed by CORS.'));
  },
  credentials: true,
}));

app.use('/api', portalRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);

mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err.message));

app.get('/', (req, res) => {
  res.status(200).json({ status: 'healthy', message: 'API active' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
// trigger restart
