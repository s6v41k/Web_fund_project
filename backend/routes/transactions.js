const express = require('express');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const pool = require('../db');


const {
  create,
  getAllByUser,
  update,
  remove
} = require('../models/Transaction');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const transactionSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required(),
  category: Joi.string().required(),
  description: Joi.string().allow('')
});

// CREATE
router.post('/', auth, async (req, res) => {
  const { amount, category, description, date } = req.body
  const userId = req.userId

  const createdAt = date ? new Date(date) : new Date()

  try {
    await create(
      userId,
      amount,
      category,
      description,
      createdAt
    )

    res.status(201).json({ message: 'Transaction added' })
  } catch {
    res.status(500).json({ message: 'Database error' })
  }
})



// READ
router.get('/', auth, async (req, res) => {
  const transactions = await getAllByUser(req.userId);
  res.json(transactions);
});

// UPDATE
router.put('/:id', auth, async (req, res) => {
  const { error } = transactionSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { amount, category, description } = req.body;
  await update(req.params.id, req.userId, amount, category, description);
  res.json({ message: 'Updated' });
});

// DELETE
router.delete('/:id', auth, async (req, res) => {
  await remove(req.params.id, req.userId);
  res.json({ message: 'Transaction deleted' });
});

module.exports = router;
