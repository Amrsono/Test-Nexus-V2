const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const activeCount = await prisma.user.count({ where: { subscriptionStatus: 'ACTIVE' } });
  const totalCount = await prisma.user.count();
  console.log('--- DATABASE CHECK ---');
  console.log('Total Users:', totalCount);
  console.log('Active Premium Users:', activeCount);
}

check().catch(console.error).finally(() => prisma.$disconnect());
