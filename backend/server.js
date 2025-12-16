// server.js - Main Express server for FinTracker
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;  // Use .env or default to 3000

// Import routes (single place, no duplicates)
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const goalRoutes = require('./routes/goals');
const adminRoutes = require('./routes/admin');

// Middleware
app.use(helmet());  // Security headers
app.use(cors({ origin: true }));  // Allow all origins for dev (fix CORS for any port)
app.use(express.json({ limit: '10mb' }));  // Parse JSON bodies

// Mount routes (single place, no duplicates)
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/admin', adminRoutes);

// Test route for debugging
app.get('/test', (req, res) => res.json({ message: 'Server OK' }));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware (catch all)
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);  // Log full error
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log('Routes loaded: auth, transactions, goals, admin');
});