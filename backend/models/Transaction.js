// models/Transaction.js - CRUD operations for transactions
const pool = require('../db');

// Create a new transaction
const create = async (userId, amount, category, description) => {
  try {
    const [result] = await pool.execute(
      'INSERT INTO transactions (user_id, amount, category, description) VALUES (?, ?, ?, ?)',
      [userId, amount, category, description]
    );
    return result.insertId;
  } catch (error) {
    throw new Error(`Transaction creation failed: ${error.message}`);
  }
};

// Get all by user
const getAllByUser = async (userId) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    return rows;
  } catch (error) {
    throw new Error(`Fetching failed: ${error.message}`);
  }
};

// Update by ID
const update = async (id, amount, category, description) => {
  try {
    await pool.execute(
      'UPDATE transactions SET amount = ?, category = ?, description = ? WHERE id = ?',
      [amount, category, description, id]
    );
  } catch (error) {
    throw new Error(`Update failed: ${error.message}`);
  }
};

// Delete by ID
const remove = async (id) => {
  try {
    await pool.execute('DELETE FROM transactions WHERE id = ?', [id]);
  } catch (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
};

module.exports = { create, getAllByUser, update, remove };