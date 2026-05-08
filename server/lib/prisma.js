const { PrismaClient } = require('@prisma/client');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

if (!process.env.DATABASE_URL) {
  console.error('CRITICAL: DATABASE_URL is not defined in the environment!');
}

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    log: ['error', 'warn'],
  });
} else {
  // In development, use a global variable so that the PrismaClient
  // instance is not recreated on every hot reload.
  if (!global.prisma) {
    console.log('[Prisma] Initializing new client in development...');
    global.prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
  }
  prisma = global.prisma;
}

// Add a connection check
prisma.$connect()
  .then(() => console.log('[Prisma] Successfully connected to the database'))
  .catch((err) => console.error('[Prisma] Failed to connect to the database:', err.message));

module.exports = prisma;
