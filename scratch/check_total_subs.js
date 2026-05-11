const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const totalRequests = await prisma.subscriptionRequest.count();
  console.log('Total Subscription Requests in DB:', totalRequests);
}

check().catch(console.error).finally(() => prisma.$disconnect());
