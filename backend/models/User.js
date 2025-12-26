// // models/User.js - Raw MySQL user operations with bcrypt
// const pool = require('../db');
// const bcrypt = require('bcryptjs');

// const createUser = async (email, password, role = 'user') => {
//   try {
//     const hashedPw = await bcrypt.hash(password, 10);
//     const [result] = await pool.execute(
//       'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
//       [email, hashedPw, role]
//     );
//     return result.insertId;
//   } catch (error) {
//     throw new Error(`User creation failed: ${error.message}`);
//   }
// };

// const findUserByEmail = async (email) => {
//   try {
//     const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
//     return rows[0];
//   } catch (error) {
//     throw new Error(`User lookup failed: ${error.message}`);
//   }
// };

// const comparePassword = async (password, hashed) => {
//   return await bcrypt.compare(password, hashed);
// };

// const getAllUsers = async () => {
//   try {
//     const [rows] = await pool.execute('SELECT id, email, role, created_at FROM users');
//     return rows;
//   } catch (error) {
//     throw new Error(`Fetch users failed: ${error.message}`);
//   }
// };

// const updateUserRole = async (userId, role) => {
//   try {
//     if (!['user', 'admin'].includes(role)) {
//       throw new Error('Invalid role');
//     }
//     await pool.execute('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
//   } catch (error) {
//     throw new Error(`Update role failed: ${error.message}`);
//   }
// };

// export async function updateUserPassword(userId, newPassword) {
//   const hash = await bcrypt.hash(newPassword, 10);
//   await pool.execute(
//     'UPDATE users SET password = ? WHERE id = ?',
//     [hash, userId]
//   );
// }


// const getUserById = async (id) => {
//   const [rows] = await pool.execute(
//     'SELECT id, email, nickname, role, createdAt FROM users WHERE id = ?',
//     [id]
//   );
//   return rows[0];
// };

// const updateNickname = async (userId, nickname) => {
//   await pool.execute(
//     'UPDATE users SET nickname = ? WHERE id = ?',
//     [nickname, userId]
//   );
// };

// module.exports = {
//   createUser,
//   findUserByEmail,
//   comparePassword,
//   getAllUsers,
//   updateUserRole,
//   getUserById,
//   updateNickname
// };

// models/User.js - Raw MySQL user operations with bcrypt
const pool = require('../db');
const bcrypt = require('bcryptjs');

const createUser = async (email, password, role = 'user') => {
  const hashedPw = await bcrypt.hash(password, 10);
  const [result] = await pool.execute(
    'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
    [email, hashedPw, role]
  );
  return result.insertId;
};

const findUserByEmail = async (email) => {
  const [rows] = await pool.execute(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );
  return rows[0];
};

const comparePassword = async (password, hashed) => {
  return bcrypt.compare(password, hashed);
};

const getAllUsers = async () => {
  const [rows] = await pool.execute(
    'SELECT id, email, role, createdAt FROM users'
  );
  return rows;
};

const updateUserRole = async (userId, role) => {
  if (!['user', 'admin'].includes(role)) {
    throw new Error('Invalid role');
  }
  await pool.execute(
    'UPDATE users SET role = ? WHERE id = ?',
    [role, userId]
  );
};

const updateUserPassword = async (userId, newPassword) => {
  const hash = await bcrypt.hash(newPassword, 10);
  await pool.execute(
    'UPDATE users SET password = ? WHERE id = ?',
    [hash, userId]
  );
};

const getUserById = async (id) => {
  const [rows] = await pool.execute(
    'SELECT id, email, nickname, role, createdAt FROM users WHERE id = ?',
    [id]
  );
  return rows[0];
};

const updateNickname = async (userId, nickname) => {
  await pool.execute(
    'UPDATE users SET nickname = ? WHERE id = ?',
    [nickname, userId]
  );
};

const updateUserEmail = async (userId, email) => {
  await pool.execute(
    'UPDATE users SET email = ? WHERE id = ?',
    [email, userId]
  );
};

const updateUserPhoto = async (userId, photo) => {
  await pool.execute(
    'UPDATE users SET photo = ? WHERE id = ?',
    [photo, userId]
  );
};

const deleteUser = async (userId) => {
  await pool.execute(
    'DELETE FROM users WHERE id = ?',
    [userId]
  );
};

module.exports = {
  createUser,
  findUserByEmail,
  comparePassword,
  getAllUsers,
  updateUserRole,
  updateUserPassword,
  getUserById,
  updateNickname,
  updateUserEmail,
  updateUserPhoto,
  deleteUser
};
