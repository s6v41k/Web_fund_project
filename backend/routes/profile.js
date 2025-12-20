// routes/profile.js - Protected profile update (edit email)
const express = require('express');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { findUserByEmail, updateUserRole } = require('../models/User');
const pool = require('../db');  // For raw update

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Auth middleware (reuse from auth.js)
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// GET /api/profile - Get user profile
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, email, role, created_at FROM users WHERE id = ?', [req.userId]);
    const user = rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user.id, email: user.email, role: user.role, createdAt: user.created_at });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/profile - Update email (password change separate)
router.put('/', auth, async (req, res) => {
  try {
    const schema = Joi.object({
      email: Joi.string().email().required()
    });
    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { email } = req.body;
    const existingUser = await findUserByEmail(email);
    if (existingUser && existingUser.id !== req.userId) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    await pool.execute('UPDATE users SET email = ? WHERE id = ?', [email, req.userId]);
    res.json({ message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;