const pool = require('../db');

const create = async (userId, amount, category, description, createdAt) => {
  await pool.execute(
    `INSERT INTO transactions (userId, amount, category, description, createdAt)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, amount, category, description, createdAt || new Date()]
  );

  await pool.execute(
    `UPDATE goals
     SET current_amount = current_amount + ?
     WHERE user_id = ? AND category = ?`,
    [amount, userId, category]
  );
};

const getAllByUser = async (userId) => {
  const [rows] = await pool.execute(
    `SELECT * FROM transactions
     WHERE userId = ?
     ORDER BY createdAt DESC`,
    [userId]
  );
  return rows;
};

const update = async (id, userId, amount, category, description) => {
  const [[oldTx]] = await pool.execute(
    `SELECT amount, category FROM transactions
     WHERE id = ? AND userId = ?`,
    [id, userId]
  );

  if (!oldTx) throw new Error('Transaction not found');

  await pool.execute(
    `UPDATE transactions
     SET amount = ?, category = ?, description = ?
     WHERE id = ? AND userId = ?`,
    [amount, category, description, id, userId]
  );

  await pool.execute(
    `UPDATE goals
     SET current_amount = current_amount - ?
     WHERE user_id = ? AND category = ?`,
    [oldTx.amount, userId, oldTx.category]
  );

  await pool.execute(
    `UPDATE goals
     SET current_amount = current_amount + ?
     WHERE user_id = ? AND category = ?`,
    [amount, userId, category]
  );
};

const remove = async (id, userId) => {
  const [[tx]] = await pool.execute(
    `SELECT amount, category FROM transactions
     WHERE id = ? AND userId = ?`,
    [id, userId]
  );

  if (!tx) throw new Error('Transaction not found');

  await pool.execute(
    `DELETE FROM transactions WHERE id = ?`,
    [id]
  );

  await pool.execute(
    `UPDATE goals
     SET current_amount = current_amount - ?
     WHERE user_id = ? AND category = ?`,
    [tx.amount, userId, tx.category]
  );
};

module.exports = {
  create,
  getAllByUser,
  update,
  remove
};
