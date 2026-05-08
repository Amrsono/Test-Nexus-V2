
try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    console.log('Prisma Client loaded successfully');
} catch (error) {
    console.error('Prisma Load Error:', error.message);
    console.error('Error Stack:', error.stack);
}
