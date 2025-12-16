// routes/goals.js - Protected CRUD for user goals
const express = require('express');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { createGoal, getAllByUser, updateCurrentAmount, deleteGoal } = require('../models/Goal');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Local auth middleware (copied from transactions.js to avoid import issues)
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
const goalSchema = Joi.object({
  category: Joi.string().required(),
  targetAmount: Joi.number().positive().precision(2).required()
});

// POST /api/goals - Create goal
router.post('/', auth, async (req, res) => {
  try {
    const { error } = goalSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const { category, targetAmount } = req.body;
    const id = await createGoal(req.userId, category, targetAmount);
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/goals - List goals
router.get('/', auth, async (req, res) => {
  try {
    const goals = await getAllByUser(req.userId);
    res.json(goals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/goals/:id - Update current amount (e.g., after transaction)
router.put('/:id', auth, async (req, res) => {
  try {
    const { currentAmount } = req.body;
    await updateCurrentAmount(req.params.id, currentAmount);
    res.json({ message: 'Goal updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/goals/:id - Delete goal
router.delete('/:id', auth, async (req, res) => {
  try {
    await deleteGoal(req.params.id);
    res.json({ message: 'Goal deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;