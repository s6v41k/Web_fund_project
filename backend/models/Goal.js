// models/Goal.js - Raw MySQL CRUD for user goals
const pool = require('../db');

const createGoal = async (userId, category, targetAmount) => {
  try {
    const [result] = await pool.execute(
      'INSERT INTO goals (user_id, category, target_amount) VALUES (?, ?, ?)',
      [userId, category, targetAmount]
    );
    return result.insertId;
  } catch (error) {
    throw new Error(`Goal creation failed: ${error.message}`);
  }
};

const getAllByUser = async (userId) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    return rows;
  } catch (error) {
    throw new Error(`Fetching goals failed: ${error.message}`);
  }
};

const updateCurrentAmount = async (goalId, currentAmount) => {
  try {
    await pool.execute(
      'UPDATE goals SET current_amount = ? WHERE id = ?',
      [currentAmount, goalId]
    );
  } catch (error) {
    throw new Error(`Update goal failed: ${error.message}`);
  }
};

const deleteGoal = async (goalId) => {
  try {
    await pool.execute('DELETE FROM goals WHERE id = ?', [goalId]);
  } catch (error) {
    throw new Error(`Delete goal failed: ${error.message}`);
  }
};

module.exports = { createGoal, getAllByUser, updateCurrentAmount, deleteGoal };