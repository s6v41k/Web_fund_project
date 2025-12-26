// server.js - Main Express server for FinTracker
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Routes (CommonJS, single import)
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const goalRoutes = require('./routes/goals');
const adminRoutes = require('./routes/admin');
const profileRoutes = require('./routes/profile');

// Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);
app.use('/uploads', express.static('uploads'));

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Static files (avatars)

app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'), {
    setHeaders: (res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    }
  })
);


// API routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server OK' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
