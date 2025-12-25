const express = require('express');
const jwt = require('jsonwebtoken');
const {
  createGoal,
  getAllByUser,
  updateGoal,
  deleteGoal,
  getHistoricalByCategory
} = require('../models/Goal');

const router = express.Router();

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(403).json({ error: 'Invalid token' });
  }
};

router.get('/', auth, async (req, res) => {
  res.json(await getAllByUser(req.userId));
});

router.post('/', auth, async (req, res) => {
  const { category, targetAmount } = req.body;
  const goal = await createGoal(req.userId, category, Number(targetAmount));
  res.status(201).json(goal);
});

router.put('/:id', auth, async (req, res) => {
  const { currentAmount } = req.body;

  if (typeof currentAmount !== 'number') {
    return res.status(400).json({ error: 'currentAmount is required' });
  }

  await updateGoal(Number(req.params.id), currentAmount);
  res.json({ message: 'Updated' });
});


router.delete('/:id', auth, async (req, res) => {
  const goalId = req.params.id;

  if (!goalId) {
    return res.status(400).json({ error: 'Goal ID is required' });
  }

  await deleteGoal(goalId);
  res.json({ message: 'Goal deleted' });
});


router.get('/historical/:category', auth, async (req, res) => {
  const data = await getHistoricalByCategory(req.userId, req.params.category);
  res.json(data);
});

module.exports = router;
