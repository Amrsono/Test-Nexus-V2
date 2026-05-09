require('dotenv').config({ path: './.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orphans = await prisma.project.findMany({
    where: { ownerId: null },
    include: { _count: { select: { testSuites: true } } }
  });

  console.log(`Found ${orphans.length} ownerless project(s)`);
  if (orphans.length === 0) return;

  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const firstUser = await prisma.user.findFirst();
  const targetUser = admin || firstUser;
  
  if (!targetUser) {
    console.log('No users found.');
    return;
  }

  console.log(`Assigning to: ${targetUser.email}`);

  for (const p of orphans) {
    await prisma.project.update({
      where: { id: p.id },
      data: { ownerId: targetUser.id }
    });
    console.log(`Assigned "${p.name}"`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
