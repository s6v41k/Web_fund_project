// routes/admin.js - Admin routes for user management and stats (protected for admin role)
const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const {
  getAllUsers,
  updateUserRole,
  updateUserPassword,
  updateNickname,
  updateUserEmail,
  updateUserPhoto,
  deleteUser,
  getUserById
} = require('../models/User');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: 'uploads/avatars',
  filename: (req, file, cb) => {
    const userId = req.params.id || req.body.userId;
    cb(null, `user_${userId}_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Middleware to verify token and admin role
const adminAuth = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;

    // Check role from database
    const user = await getUserById(req.userId);
    if (!user || (user.role || '').toLowerCase() !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

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

// GET /api/admin/users/:id - Get user by ID
router.get('/users/:id', adminAuth, async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/users/:id - Update user data (email, nickname, photo, password)
router.put('/users/:id', adminAuth, async (req, res) => {
  try {
    const { email, nickname, photo, password } = req.body;

    if (email) await updateUserEmail(req.params.id, email);
    if (nickname) await updateNickname(req.params.id, nickname);
    if (photo) await updateUserPhoto(req.params.id, photo);
    if (password) await updateUserPassword(req.params.id, password);

    res.json({ message: 'User updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/users/:id - Delete user
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    await deleteUser(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/users/:id/avatar - Upload avatar for user
router.post('/users/:id/avatar', adminAuth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const avatarPath = `/uploads/avatars/${req.file.filename}`;
    await updateUserPhoto(req.params.id, avatarPath);

    res.json({ photo: avatarPath, message: 'Avatar uploaded successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;