const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findUnique({ where: { email: 'admin@testnexus.com' } });
  if (!admin) {
    console.error('Admin user not found');
    return;
  }

  const result = await prisma.project.updateMany({
    where: { ownerId: null },
    data: { ownerId: admin.id }
  });

  console.log(`Updated ${result.count} projects to be owned by Admin (${admin.id})`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
