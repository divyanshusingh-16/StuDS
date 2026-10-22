require('dotenv').config();
const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}
const path = require('path');
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
  .map((origin) => origin.trim().replace(/\/+$/, ''))
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

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
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
  console.error(err.stack || err.message);
  const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : (err.status || 500);
  const message = err.code === 'LIMIT_FILE_SIZE'
    ? 'File size exceeds maximum allowed limit (35MB).'
    : (err.message || 'Internal Server Error');

  res.status(status).json({
    success: false,
    error: message
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
// trigger restart
