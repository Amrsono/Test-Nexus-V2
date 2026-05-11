const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const count = await prisma.project.count();
  console.log('Total Projects in DB:', count);
}

check().catch(console.error).finally(() => prisma.$disconnect());
