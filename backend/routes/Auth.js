// routes/auth.js - Authentication routes: register and login with JWT tokens
const express = require('express');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { createUser, findUserByEmail, comparePassword } = require('../models/User');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Enhanced validation schemas using Joi with specific password messages
const registerSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).required().messages({ 'string.email': 'Invalid email format (must be a valid email like user@gmail.com)' }),
  password: Joi.string()
    .min(8)
    .pattern(/^[a-zA-Z0-9!@#$%^&*()_+]+$/)  // Fixed regex: alphanumeric + special chars, no spaces
    .custom((value, helpers) => {
      if (!/[a-z]/.test(value)) {
        return helpers.error('password.lowercase');
      }
      if (!/[A-Z]/.test(value)) {
        return helpers.error('password.uppercase');
      }
      if (!/[!@#$%^&*()_+]/.test(value)) {
        return helpers.error('password.special');
      }
      return value;
    }, 'password validation')
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain only alphanumeric characters and special symbols (!@#$%^&*()_+ )',
      'password.lowercase': 'Password must contain at least one lowercase letter (a-z)',
      'password.uppercase': 'Password must contain at least one uppercase letter (A-Z)',
      'password.special': 'Password must contain at least one special character (!@#$%^&*()_+ )'
    })
});

const loginSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).required().messages({ 'string.email': 'Invalid email format' }),
  password: Joi.string().min(8).required().messages({ 'string.min': 'Password must be at least 8 characters' })
});

// POST /api/auth/register - Create new user with enhanced validation
router.post('/register', async (req, res) => {
  try {
    const { error } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password } = req.body;
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const userId = await createUser(email, password);  // role default 'user' in model
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({ token, userId });
  } catch (err) {
    console.error('Register error:', err);  // Log for debugging
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// POST /api/auth/login - Authenticate user with validation
router.post('/login', async (req, res) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password } = req.body;
    const user = await findUserByEmail(email);
    if (!user) {
      console.log('Login attempt with non-existent email:', email);  // Debug log
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      console.log('Login attempt with invalid password for email:', email);  // Debug log
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
    console.log('Login successful for email:', email);  // Debug log
    res.json({ token, userId: user.id });
  } catch (err) {
    console.error('Login error:', err);  // Log for debugging
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }

  const { google } = require('googleapis');
  const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:3000'
  );
// Use oauth2Client for sending (more code, but secure)
});

module.exports = router;