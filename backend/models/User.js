// models/User.js - Prisma-based user operations (replaces raw MySQL)
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Initialize PrismaClient with explicit options for dev (log queries, no preview features)
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Create a new user with hashed password and default role 'USER'
const createUser = async (email, password, role = 'USER') => {
  try {
    const hashedPw = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPw,
        role
      }
    });
    return user.id;
  } catch (error) {
    throw new Error(`User creation failed: ${error.message}`);
  }
};

// Find user by email (includes role)
const findUserByEmail = async (email) => {
  try {
    return await prisma.user.findUnique({
      where: { email }
    });
  } catch (error) {
    throw new Error(`User lookup failed: ${error.message}`);
  }
};

// Compare plain password with hashed one
const comparePassword = async (password, hashed) => {
  return await bcrypt.compare(password, hashed);
};

// Get all users for admin (excludes password)
const getAllUsers = async () => {
  try {
    return await prisma.user.findMany({
      select: { id: true, email: true, role: true, createdAt: true }
    });
  } catch (error) {
    throw new Error(`Fetch users failed: ${error.message}`);
  }
};

// Update user role
const updateUserRole = async (userId, role) => {
  try {
    if (!['USER', 'ADMIN'].includes(role)) {
      throw new Error('Invalid role');
    }
    await prisma.user.update({
      where: { id: userId },
      data: { role }
    });
  } catch (error) {
    throw new Error(`Update role failed: ${error.message}`);
  }
};

module.exports = { createUser, findUserByEmail, comparePassword, getAllUsers, updateUserRole };