// server.js - Main Express server
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

dotenv.config();  // Load .env

const authRoutes = require('./routes/auth');  // Import auth
const transactionRoutes = require('./routes/transactions');  // We'll add later

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173' }));  // For frontend later
app.use(express.json());

app.use('/api/auth', authRoutes);  // Mount auth routes
app.use('/api/transactions', transactionRoutes);  // Placeholder

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));  // 404 handler

app.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));