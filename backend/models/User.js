// models/User.js - User-related database operations with bcrypt for password hashing
const pool = require('../db');  // Import DB pool from db.js
const bcrypt = require('bcryptjs');  // Library for secure password hashing/salting

// Create a new user: hash password and insert into DB
const createUser = async (email, password) => {
  try {
    const hashedPw = await bcrypt.hash(password, 10);  // Generate hash (10 salt rounds)
    const [result] = await pool.execute(
      'INSERT INTO users (email, password) VALUES (?, ?)',
      [email, hashedPw]
    );
    return result.insertId;
  } catch (error) {
    throw new Error(`User creation failed: ${error.message}`);
  }
};

// Find user by email
const findUserByEmail = async (email) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  } catch (error) {
    throw new Error(`User lookup failed: ${error.message}`);
  }
};

// Compare plain password with hashed one
const comparePassword = async (password, hashed) => {
  return await bcrypt.compare(password, hashed);
};

module.exports = { createUser, findUserByEmail, comparePassword };