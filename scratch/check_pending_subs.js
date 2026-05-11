const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const pending = await prisma.subscriptionRequest.count({ where: { status: 'PENDING' } });
  console.log('Pending Subscription Requests:', pending);
}

check().catch(console.error).finally(() => prisma.$disconnect());
