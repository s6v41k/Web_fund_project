// server.js - Main Express server for FinTracker
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;  // Default to 3001 if .env not set

// Import routes (auth and transactions)
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');

// Middleware
app.use(helmet());  // Security headers
app.use(cors({ origin: true }));  // Allow any frontend requests
app.use(express.json({ limit: '10mb' }));  // Parse JSON bodies

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);

// Test route for debugging
app.get('/test', (req, res) => res.json({ message: 'Server OK' }));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
  console.log('Routes loaded: auth at /api/auth, transactions at /api/transactions');
});