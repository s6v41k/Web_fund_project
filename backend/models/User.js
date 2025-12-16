// models/User.js - Raw MySQL user operations with bcrypt
const pool = require('../db');
const bcrypt = require('bcryptjs');

const createUser = async (email, password, role = 'user') => {
  try {
    const hashedPw = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
      [email, hashedPw, role]
    );
    return result.insertId;
  } catch (error) {
    throw new Error(`User creation failed: ${error.message}`);
  }
};

const findUserByEmail = async (email) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  } catch (error) {
    throw new Error(`User lookup failed: ${error.message}`);
  }
};

const comparePassword = async (password, hashed) => {
  return await bcrypt.compare(password, hashed);
};

const getAllUsers = async () => {
  try {
    const [rows] = await pool.execute('SELECT id, email, role, created_at FROM users');
    return rows;
  } catch (error) {
    throw new Error(`Fetch users failed: ${error.message}`);
  }
};

const updateUserRole = async (userId, role) => {
  try {
    if (!['user', 'admin'].includes(role)) {
      throw new Error('Invalid role');
    }
    await pool.execute('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
  } catch (error) {
    throw new Error(`Update role failed: ${error.message}`);
  }
};

module.exports = { createUser, findUserByEmail, comparePassword, getAllUsers, updateUserRole };