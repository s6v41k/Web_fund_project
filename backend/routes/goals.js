// const express = require('express');
// const jwt = require('jsonwebtoken');
// const {
//   createGoal,
//   getAllByUser,
//   updateGoal,
//   deleteGoal,
//   getHistoricalByCategory
// } = require('../models/Goal');

// const router = express.Router();

// const auth = (req, res, next) => {
//   const token = req.headers.authorization?.split(' ')[1];
//   if (!token) return res.status(401).json({ error: 'No token' });
//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.userId = decoded.userId;
//     next();
//   } catch {
//     res.status(403).json({ error: 'Invalid token' });
//   }
// };

// router.get('/', auth, async (req, res) => {
//   res.json(await getAllByUser(req.userId));
// });

// router.post('/', auth, async (req, res) => {
//   const { category, target_amount } = req.body;

//   if (!category || typeof target_amount !== 'number') {
//     return res.status(400).json({ error: 'category and target_amount required' });
//   }

//   const goal = await createGoal(
//     req.user.id,
//     category,
//     target_amount
//   );

//   res.status(201).json(goal);
// });


// router.put('/:id', auth, async (req, res) => {
//   const { category, target_amount } = req.body;

//   if (!category || typeof target_amount !== 'number') {
//     return res.status(400).json({ error: 'category and target_amount required' });
//   }

//   await pool.execute(
//     'UPDATE goals SET category = ?, target_amount = ? WHERE id = ? AND user_id = ?',
//     [category, target_amount, req.params.id, req.user.id]
//   );

//   res.json({ message: 'Goal updated' });
// });



// router.delete('/:id', auth, async (req, res) => {
//   const goalId = req.params.id;

//   if (!goalId) {
//     return res.status(400).json({ error: 'Goal ID is required' });
//   }

//   await deleteGoal(goalId);
//   res.json({ message: 'Goal deleted' });
// });


// router.get('/historical/:category', auth, async (req, res) => {
//   const data = await getHistoricalByCategory(req.userId, req.params.category);
//   res.json(data);
// });

// module.exports = router;

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
  const goals = await getAllByUser(req.userId);
  res.json(goals);
});

router.post('/', auth, async (req, res) => {
  const { category, target_amount } = req.body;

  if (!category || typeof target_amount !== 'number') {
    return res.status(400).json({ error: 'category and target_amount required' });
  }

  const goal = await createGoal(
    req.userId,
    category,
    target_amount
  );

  res.status(201).json(goal);
});

router.put('/:id', auth, async (req, res) => {
  const { target_amount } = req.body;

  if (typeof target_amount !== 'number') {
    return res.status(400).json({ error: 'target_amount must be number' });
  }

  await updateGoal(req.params.id, target_amount);
  res.json({ message: 'Goal updated' });
});


router.delete('/:id', auth, async (req, res) => {
  await deleteGoal(req.params.id);
  res.json({ message: 'Goal deleted' });
});

router.get('/historical/:category', auth, async (req, res) => {
  const data = await getHistoricalByCategory(
    req.userId,
    req.params.category
  );
  res.json(data);
});

module.exports = router;
