require('dotenv').config({ path: './.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, email: true, role: true } });
  console.log("Users:", users);

  const projects = await prisma.project.findMany({ select: { id: true, name: true, ownerId: true } });
  console.log("\nProjects:", projects);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
