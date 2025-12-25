const pool = require('../db');

const getAllByUser = async (userId) => {
  const [rows] = await pool.execute(
    'SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );
  return rows;
};

const createGoal = async (userId, category, targetAmount) => {
  const [result] = await pool.execute(
    'INSERT INTO goals (user_id, category, target_amount, current_amount) VALUES (?, ?, ?, 0)',
    [userId, category, targetAmount]
  );
  return result.insertId;
};

const updateGoal = async (goalId, currentAmount) => {
  if (typeof currentAmount !== 'number') {
    throw new Error('currentAmount must be a number');
  }

  await pool.execute(
    'UPDATE goals SET current_amount = ? WHERE id = ?',
    [currentAmount, goalId]
  );
};

const deleteGoal = async (goalId) => {
  if (!goalId) {
    throw new Error('deleteGoal: goalId is undefined');
  }

  await pool.execute(
    'DELETE FROM goals WHERE id = ?',
    [goalId]
  );
};


module.exports = {
  getAllByUser,
  createGoal,
  updateGoal,
  deleteGoal
};
