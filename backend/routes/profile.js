// const express = require('express');
// const jwt = require('jsonwebtoken');
// const Joi = require('joi');
// const bcrypt = require('bcryptjs');
// const multer = require('multer');
// const path = require('path');

// const pool = require('../db');
// const {
//   findUserByEmail,
//   updateUserPassword,
//   updateNickname
// } = require('../models/User');

// const router = express.Router();
// const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// /* =======================
//    AUTH MIDDLEWARE
// ======================= */
// const auth = (req, res, next) => {
//   const token = req.header('Authorization')?.replace('Bearer ', '');
//   if (!token) return res.status(401).json({ error: 'No token' });

//   try {
//     const decoded = jwt.verify(token, JWT_SECRET);
//     req.userId = decoded.userId;
//     next();
//   } catch {
//     res.status(401).json({ error: 'Invalid token' });
//   }
// };

// /* =======================
//    MULTER (AVATAR)
// ======================= */
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/avatars');
//   },
//   filename: (req, file, cb) => {
//     const ext = path.extname(file.originalname);
//     cb(null, `user_${req.userId}${ext}`);
//   }
// });

// const upload = multer({
//   storage,
//   limits: { fileSize: 2 * 1024 * 1024 },
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype.startsWith('image/')) cb(null, true);
//     else cb(new Error('Only images allowed'), false);
//   }
// });

// /* =======================
//    AVATAR UPLOAD
// ======================= */
// router.post('/avatar', auth, upload.single('avatar'), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ error: 'No file uploaded' });
//     }

//     const avatarPath = `/uploads/avatars/${req.file.filename}`;

//     await pool.execute(
//       'UPDATE users SET avatar = ? WHERE id = ?',
//       [avatarPath, req.userId]
//     );

//     res.json({ avatar: avatarPath });
//   } catch {
//     res.status(500).json({ error: 'Avatar upload failed' });
//   }
// });

// /* =======================
//    CHANGE PASSWORD
// ======================= */
// router.put('/password', auth, async (req, res) => {
//   const schema = Joi.object({
//     currentPassword: Joi.string().min(1).required(),
//     newPassword: Joi.string().min(6).required()
//   });

//   const { error } = schema.validate(req.body);
//   if (error) {
//     return res.status(400).json({ error: error.details[0].message });
//   }

//   const { currentPassword, newPassword } = req.body;

//   const [rows] = await pool.execute(
//     'SELECT password FROM users WHERE id = ?',
//     [req.user.id]
//   );

//   if (!rows.length) {
//     return res.status(404).json({ error: 'User not found' });
//   }

//   const isValid = await bcrypt.compare(
//     currentPassword,
//     rows[0].password
//   );

//   if (!isValid) {
//     return res.status(400).json({ error: 'Current password incorrect' });
//   }

//   const hash = await bcrypt.hash(newPassword, 10);
//   await pool.execute(
//     'UPDATE users SET password = ? WHERE id = ?',
//     [hash, req.user.id]
//   );

//   res.json({ message: 'Password updated' });
// });


// /* =======================
//    GET PROFILE
// ======================= */
// router.get('/', auth, async (req, res) => {
//   try {
//     const [rows] = await pool.execute(
//       'SELECT id, email, role, createdAt, birthdate, nickname, avatar FROM users WHERE id = ?',
//       [req.userId]
//     );

//     if (!rows.length) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     res.json(rows[0]);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// /* =======================
//    UPDATE EMAIL + BIRTHDATE
// ======================= */
// router.put('/', auth, async (req, res) => {
//   const schema = Joi.object({
//   email: Joi.string().email().required(),
//   birthdate: Joi.string().allow(null, '')
// });

//   const { error } = schema.validate(req.body);
//   if (error) return res.status(400).json({ error: error.details[0].message });

//   const { email, birthdate } = req.body;

//   try {
//     const existingUser = await findUserByEmail(email);
//     if (existingUser && existingUser.id !== req.userId) {
//       return res.status(400).json({ error: 'Email already in use' });
//     }

//     await pool.execute(
//       'UPDATE users SET email = ?, birthdate = ? WHERE id = ?',
//       [
//         email,
//         birthdate && birthdate !== '' ? birthdate : null,
//         req.userId
//       ]
//     );


//     res.json({ message: 'Profile updated' });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// /* =======================
//    UPDATE NICKNAME
// ======================= */
// router.put('/nickname', auth, async (req, res) => {
//   const schema = Joi.object({
//     nickname: Joi.string().min(3).max(50).required()
//   });

//   const { error } = schema.validate(req.body);
//   if (error) return res.status(400).json({ error: error.details[0].message });

//   try {
//     await updateNickname(req.userId, req.body.nickname);
//     res.json({ message: 'Nickname updated' });
//   } catch {
//     res.status(400).json({ error: 'Nickname already taken' });
//   }
// });

// router.delete('/avatar', auth, async (req, res) => {
//   try {
//     await pool.execute(
//       'UPDATE users SET avatar = NULL WHERE id = ?',
//       [req.userId]
//     );

//     res.json({ message: 'Avatar removed' });
//   } catch (err) {
//     res.status(500).json({ error: 'Failed to remove avatar' });
//   }
// });

// router.delete('/nickname', auth, async (req, res) => {
//   try {
//     await pool.execute(
//       'UPDATE users SET nickname = NULL WHERE id = ?',
//       [req.userId]
//     );

//     res.json({ message: 'Nickname removed' });
//   } catch (err) {
//     res.status(500).json({ error: 'Failed to remove nickname' });
//   }
// });



// module.exports = router;

// const express = require('express');
// const jwt = require('jsonwebtoken');
// const Joi = require('joi');
// const bcrypt = require('bcryptjs');
// const multer = require('multer');
// const path = require('path');

// const pool = require('../db');
// const { findUserByEmail } = require('../models/User');

// const router = express.Router();
// const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// /* =======================
//    AUTH MIDDLEWARE
// ======================= */
// const auth = (req, res, next) => {
//   const token = req.header('Authorization')?.replace('Bearer ', '');
//   if (!token) return res.status(401).json({ error: 'No token' });

//   try {
//     const decoded = jwt.verify(token, JWT_SECRET);
//     req.userId = decoded.userId;
//     next();
//   } catch {
//     res.status(401).json({ error: 'Invalid token' });
//   }
// };

// /* =======================
//    CHANGE PASSWORD
// ======================= */
// router.put('/password', auth, async (req, res) => {
//   try {
//     const schema = Joi.object({
//       currentPassword: Joi.string().required(),
//       newPassword: Joi.string().min(6).required()
//     });

//     const { error } = schema.validate(req.body);
//     if (error) {
//       return res.status(400).json({ error: error.details[0].message });
//     }

//     const { currentPassword, newPassword } = req.body;

//     const [rows] = await pool.execute(
//       'SELECT password FROM users WHERE id = ?',
//       [req.userId]
//     );

//     if (!rows.length) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     const isValid = await bcrypt.compare(currentPassword, rows[0].password);
//     if (!isValid) {
//       return res.status(400).json({ error: 'Current password incorrect' });
//     }

//     const hash = await bcrypt.hash(newPassword, 10);
//     await pool.execute(
//       'UPDATE users SET password = ? WHERE id = ?',
//       [hash, req.userId]
//     );

//     res.json({ message: 'Password updated' });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Server error' });
//   }
// });


// /* =======================
//    GET PROFILE
// ======================= */
// router.get('/', auth, async (req, res) => {
//   const [rows] = await pool.execute(
//     'SELECT id, email, nickname, avatar FROM users WHERE id = ?',
//     [req.userId]
//   );

//   if (!rows.length) {
//     return res.status(404).json({ error: 'User not found' });
//   }

//   res.json(rows[0]);
// });

// /* =======================
//    UPDATE EMAIL (OPTIONAL)
// ======================= */
// router.put('/', auth, async (req, res) => {
//   const schema = Joi.object({
//     email: Joi.string().email().allow(null, '')
//   });

//   const { error } = schema.validate(req.body);
//   if (error) return res.status(400).json({ error: error.details[0].message });

//   const { email } = req.body;

//   if (!email) {
//     return res.json({ message: 'Nothing to update' });
//   }

//   const existingUser = await findUserByEmail(email);
//   if (existingUser && existingUser.id !== req.userId) {
//     return res.status(400).json({ error: 'Email already in use' });
//   }

//   await pool.execute(
//     'UPDATE users SET email = ? WHERE id = ?',
//     [email, req.userId]
//   );

//   res.json({ message: 'Email updated' });
// });

// module.exports = router;


const express = require('express');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');

const pool = require('../db');
const { findUserByEmail } = require('../models/User');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

/* =======================
   AUTH MIDDLEWARE
======================= */
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

/* =======================
   MULTER (AVATAR)
======================= */
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(
      null,
      `${req.userId}-${Date.now()}${path.extname(file.originalname)}`
    );
  }
});

const upload = multer({ storage });

/* =======================
   CHANGE PASSWORD
======================= */
router.put('/password', auth, async (req, res) => {
  try {
    const schema = Joi.object({
      currentPassword: Joi.string().required(),
      newPassword: Joi.string().min(6).required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { currentPassword, newPassword } = req.body;

    const [rows] = await pool.execute(
      'SELECT password FROM users WHERE id = ?',
      [req.userId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValid = await bcrypt.compare(
      currentPassword,
      rows[0].password
    );

    if (!isValid) {
      return res.status(400).json({ error: 'Current password incorrect' });
    }

    const hash = await bcrypt.hash(newPassword, 10);

    await pool.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hash, req.userId]
    );

    res.json({ message: 'Password updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* =======================
   GET PROFILE
======================= */
router.get('/', auth, async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT id, email, nickname, avatar, photo FROM users WHERE id = ?',
    [req.userId]
  );

  if (!rows.length) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(rows[0]);
});

/* =======================
   UPDATE EMAIL
======================= */
router.put('/', auth, async (req, res) => {
  const schema = Joi.object({
    email: Joi.string().email().allow('', null)
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { email } = req.body;

  if (!email) {
    return res.json({ message: 'Nothing to update' });
  }

  const existingUser = await findUserByEmail(email);
  if (existingUser && existingUser.id !== req.userId) {
    return res.status(400).json({ error: 'Email already in use' });
  }

  await pool.execute(
    'UPDATE users SET email = ? WHERE id = ?',
    [email, req.userId]
  );

  res.json({ message: 'Email updated' });
});

/* =======================
   UPDATE NICKNAME
======================= */
router.put('/nickname', auth, async (req, res) => {
  const schema = Joi.object({
    nickname: Joi.string().allow('', null)
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  await pool.execute(
    'UPDATE users SET nickname = ? WHERE id = ?',
    [req.body.nickname || null, req.userId]
  );

  res.json({ message: 'Nickname updated' });
});

/* =======================
   DELETE NICKNAME
======================= */
router.delete('/nickname', auth, async (req, res) => {
  await pool.execute(
    'UPDATE users SET nickname = NULL WHERE id = ?',
    [req.userId]
  );

  res.json({ message: 'Nickname removed' });
});

/* =======================
   UPLOAD AVATAR
======================= */
router.post(
  '/avatar',
  auth,
  upload.single('avatar'),
  async (req, res) => {
    const avatarPath = `/uploads/${req.file.filename}`;

    await pool.execute(
      'UPDATE users SET avatar = ? WHERE id = ?',
      [avatarPath, req.userId]
    );

    res.json({ avatar: avatarPath });
  }
);

/* =======================
   DELETE AVATAR
======================= */
router.delete('/avatar', auth, async (req, res) => {
  await pool.execute(
    'UPDATE users SET avatar = NULL WHERE id = ?',
    [req.userId]
  );

  res.json({ message: 'Avatar removed' });
});

/* =======================
   DELETE ACCOUNT
======================= */
router.delete('/account', auth, async (req, res) => {
  try {
    await pool.execute(
      'DELETE FROM users WHERE id = ?',
      [req.userId]
    );

    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

module.exports = router;

