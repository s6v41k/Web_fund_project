const pool = require('../db');

// Create transaction
const create = async (userId, amount, category, description) => {
  const [result] = await pool.execute(
    'INSERT INTO transactions (user_id, amount, category, description) VALUES (?, ?, ?, ?)',
    [userId, amount, category, description]
  );
  return result.insertId;
};

// Get all transactions for user
const getAllByUser = async (userId) => {
  const [rows] = await pool.execute(
    'SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );
  return rows;
};

// Update transaction
const update = async (id, userId, amount, category, description) => {
  await pool.execute(
    'UPDATE transactions SET amount=?, category=?, description=? WHERE id=? AND user_id=?',
    [amount, category, description, id, userId]
  );
};

// Delete transaction
const remove = async (id, userId) => {
  await pool.execute(
    'DELETE FROM transactions WHERE id=? AND user_id=?',
    [id, userId]
  );
};

module.exports = { create, getAllByUser, update, remove };
