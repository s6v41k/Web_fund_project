// routes/transactions.js - Protected CRUD for transactions
const express = require('express');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { create, getAllByUser, update, remove } = require('../models/Transaction');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Middleware to verify token
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

// Validation schema
const transactionSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required(),
  category: Joi.string().required(),
  description: Joi.string().allow('')
});

// POST /api/transactions - Create
router.post('/', auth, async (req, res) => {
  try {
    const { error } = transactionSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const { amount, category, description } = req.body;
    const id = await create(req.userId, amount, category, description);
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/transactions - List
router.get('/', auth, async (req, res) => {
  try {
    const transactions = await getAllByUser(req.userId);
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/transactions/:id - Update
router.put('/:id', auth, async (req, res) => {
  try {
    const { error } = transactionSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const { amount, category, description } = req.body;
    await update(req.params.id, amount, category, description);
    res.json({ message: 'Updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/transactions/:id - Delete
router.delete('/:id', auth, async (req, res) => {
  try {
    await remove(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;