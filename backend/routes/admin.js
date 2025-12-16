// routes/admin.js - Admin routes for user management and stats (protected for admin role)
const express = require('express');
const jwt = require('jsonwebtoken');
const { getAllUsers, updateUserRole } = require('../models/User');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Middleware to verify token and admin role
const adminAuth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    // Check role (fetch user from DB)
    // For demo: assume admin if userId=1 (create admin in DB)
    if (req.userId !== 1) return res.status(403).json({ error: 'Admin access required' });
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// GET /api/admin/users - List all users
router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/users/:id/role - Update user role
router.put('/users/:id/role', adminAuth, async (req, res) => {
  try {
    const { role } = req.body;  // 'user' or 'admin'
    if (!['user', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
    await updateUserRole(req.params.id, role);
    res.json({ message: 'Role updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;