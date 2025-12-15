// models/Transaction.js - Prisma-based CRUD for transactions
const { PrismaClient } = require('@prisma/client');

// Initialize PrismaClient with explicit options for dev
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Create a new transaction for user
const create = async (userId, amount, category, description) => {
  try {
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        amount,
        category,
        description
      }
    });
    return transaction.id;
  } catch (error) {
    throw new Error(`Transaction creation failed: ${error.message}`);
  }
};

// Get all by user
const getAllByUser = async (userId) => {
  try {
    return await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    throw new Error(`Fetching failed: ${error.message}`);
  }
};

// Update by ID
const update = async (id, amount, category, description) => {
  try {
    await prisma.transaction.update({
      where: { id },
      data: { amount, category, description }
    });
  } catch (error) {
    throw new Error(`Update failed: ${error.message}`);
  }
};

// Delete by ID
const remove = async (id) => {
  try {
    await prisma.transaction.delete({
      where: { id }
    });
  } catch (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
};

module.exports = { create, getAllByUser, update, remove };