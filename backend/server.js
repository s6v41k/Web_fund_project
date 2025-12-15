// server.js - Main Express server for FinTracker
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;  // Use .env or default to 3001

// Middleware
app.use(helmet());  // Security headers
app.use(cors({ origin: true }));  // Allow all origins for dev (fix CORS for any port)
app.use(express.json({ limit: '10mb' }));  // Parse JSON bodies

// Load and mount routes with error handling
let authRoutes, transactionRoutes, adminRoutes;

// Auth routes (critical - always load)
try {
  const authRoutesModule = require('./routes/auth');
  if (typeof authRoutesModule === 'function') {  // Check if it's a router function
    authRoutes = authRoutesModule;
    console.log('✅ Auth routes loaded');
  } else {
    throw new Error('Auth routes is not a valid router');
  }
} catch (err) {
  console.error('❌ Auth routes error:', err.message);
  process.exit(1);  // Stop if critical route missing
}
app.use('/api/auth', authRoutes);

// Transactions routes
try {
  const transactionRoutesModule = require('./routes/transactions');
  if (typeof transactionRoutesModule === 'function') {
    transactionRoutes = transactionRoutesModule;
    console.log('✅ Transactions routes loaded');
  } else {
    throw new Error('Transactions routes is not a valid router');
  }
} catch (err) {
  console.error('❌ Transactions routes error:', err.message);
  process.exit(1);
}
app.use('/api/transactions', transactionRoutes);

// Admin routes (optional - skip if missing)
try {
  const adminRoutesModule = require('./routes/admin');
  if (typeof adminRoutesModule === 'function') {
    adminRoutes = adminRoutesModule;
    console.log('✅ Admin routes loaded');
  } else {
    throw new Error('Admin routes is not a valid router');
  }
} catch (err) {
  console.log('⚠️ Admin routes not found - skipping');
  adminRoutes = (req, res, next) => res.status(404).json({ error: 'Admin routes not available' });
}
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
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Routes loaded: auth, transactions, admin');
});