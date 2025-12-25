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
    `INSERT INTO goals (user_id, category, target_amount, current_amount)
     VALUES (?, ?, ?, 0)`,
    [userId, category, targetAmount]
  );

  return {
    id: result.insertId,
    user_id: userId,
    category,
    target_amount: targetAmount,
    current_amount: 0
  };
};

const updateGoal = async (goalId, targetAmount) => {
  await pool.execute(
    'UPDATE goals SET target_amount = ? WHERE id = ?',
    [targetAmount, goalId]
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

const getHistoricalByCategory = async (userId, category) => {
  const [rows] = await pool.execute(
    `
    SELECT 
      DATE_FORMAT(t.createdAt, '%Y-%m') AS month,
      SUM(t.amount) AS actual
    FROM transactions t
    WHERE t.userId = ? AND t.category = ?
    GROUP BY month
    ORDER BY month
    `,
    [userId, category]
  );

  return rows;
};


module.exports = {
  getAllByUser,
  createGoal,
  updateGoal,
  deleteGoal,
  getHistoricalByCategory
};
