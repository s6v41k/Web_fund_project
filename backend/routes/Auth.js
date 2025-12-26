// routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

const { createUser, findUserByEmail, comparePassword } = require('../models/User');
const pool = require('../db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || '201794';

/* ===================== VALIDATION ===================== */

const registerSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).required(),
  password: Joi.string()
    .min(8)
    .custom((value, helpers) => {
      if (!/[a-z]/.test(value)) return helpers.message('Password must contain a lowercase letter');
      if (!/[A-Z]/.test(value)) return helpers.message('Password must contain an uppercase letter');
      if (!/[!@#$%^&*()_+]/.test(value)) return helpers.message('Password must contain a special character');
      return value;
    })
    .required()
});

const loginSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).required(),
  password: Joi.string().min(8).required()
});

/* ===================== REGISTER ===================== */

router.post('/register', async (req, res) => {
  try {
    const { error } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const { email, password } = req.body;

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const userId = await createUser(email, password);

    // Generate verification token
    const verificationToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
    const verificationLink = `http://localhost:5173/verify?token=${verificationToken}&email=${email}`;

    // Send verification email (prettier design)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to FinTracker! Verify your email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
          <div style="text-align: center; background-color: #3b82f6; color: white; padding: 20px; border-radius: 8px;">
            <h1 style="margin: 0; font-size: 28px;">FinTracker</h1>
            <p style="margin: 5px 0 0; opacity: 0.9;">Your Smart Spending Coach</p>
          </div>
          <div style="background-color: white; padding: 30px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #1f2937; font-size: 24px; margin-bottom: 10px;">Welcome aboard!</h2>
            <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">
              Hi ${email},<br>
              Thanks for joining FinTracker! To get started and unlock all features, verify your email below.
            </p>
            <a href="${verificationLink}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin: 10px 0;">
              Verify Email
            </a>
            <p style="color: #6b7280; font-size: 14px; margin-top: 20px; opacity: 0.8;">
              This link expires in 24 hours. If you didn't create an account, ignore this email.
            </p>
          </div>
          <div style="text-align: center; color: #6b7280; font-size: 12px; padding: 10px;">
            © 2025 FinTracker. All rights reserved.
          </div>
        </div>
      `
    });

    const loginToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({ token: loginToken, userId, message: 'Check your email to verify account' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/* ===================== LOGIN ===================== */

router.post('/login', async (req, res) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const { email, password } = req.body;
    const user = await findUserByEmail(email);

    if (!user || !(await comparePassword(password, user.password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Allow login without verification (as per your request)
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({
      token,
      userId: user.id,
      verified: user.verified || false,
      role: (user.role || 'user').toLowerCase()  // Normalize to lowercase
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

/* ===================== VERIFY EMAIL ===================== */

router.get('/verify', async (req, res) => {
  try {
    const { token, email } = req.query;
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await findUserByEmail(email);

    if (!user || user.id !== decoded.userId || user.verified) {
      return res.status(400).json({ error: 'Invalid or already verified token' });
    }

    await pool.execute('UPDATE users SET verified = TRUE WHERE id = ?', [user.id]);

    res.json({ message: 'Email verified! You can login now.' });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(400).json({ error: 'Token expired' });
    }
    console.error('Verify error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

/* ===================== FORGOT PASSWORD ===================== */

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const resetToken = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const resetLink = `http://localhost:5173/reset-password?token=${resetToken}&email=${email}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'FinTracker – Password Reset',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
          <div style="text-align: center; background-color: #ef4444; color: white; padding: 20px; border-radius: 8px;">
            <h1 style="margin: 0; font-size: 28px;">FinTracker</h1>
            <p style="margin: 5px 0 0; opacity: 0.9;">Your Smart Spending Coach</p>
          </div>
          <div style="background-color: white; padding: 30px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #1f2937; font-size: 24px; margin-bottom: 10px;">Reset Your Password</h2>
            <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">
              Hi ${email},<br>
              You requested a password reset. Click the button below to set a new one.
            </p>
            <a href="${resetLink}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin: 10px 0;">
              Reset Password
            </a>
            <p style="color: #6b7280; font-size: 14px; margin-top: 20px; opacity: 0.8;">
              This link expires in 15 minutes. If you didn't request this, ignore it.
            </p>
          </div>
          <div style="text-align: center; color: #6b7280; font-size: 12px; padding: 10px;">
            © 2025 FinTracker. All rights reserved.
          </div>
        </div>
      `
    });

    res.json({ message: 'Reset email sent' });

  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

/* ===================== RESET PASSWORD ===================== */

router.post('/reset-password', async (req, res) => {
  try {
    const { token, email, newPassword } = req.body;

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await findUserByEmail(email);

    if (!user || user.id !== decoded.userId) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, user.id]
    );

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Reset failed' });
  }
});

module.exports = router;