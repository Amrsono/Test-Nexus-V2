const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const totalCases = await prisma.testCase.count();
  const passedCases = await prisma.testCase.count({ where: { status: 'PASS' } });
  const totalUsers = await prisma.user.count();
  const premiumUsers = await prisma.user.count({ where: { subscriptionStatus: 'ACTIVE' } });
  const totalProjects = await prisma.project.count();
  
  console.log('--- SYSTEM WIDE STATS ---');
  console.log('Total Projects:', totalProjects);
  console.log('Total Users:', totalUsers);
  console.log('Premium Users:', premiumUsers);
  console.log('Total Test Cases:', totalCases);
  console.log('Passed Test Cases:', passedCases);
}

check().catch(console.error).finally(() => prisma.$disconnect());
