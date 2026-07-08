require('dotenv').config({ path: './.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, email: true, role: true } });
  console.log("Users:", users);

  const projects = await prisma.project.findMany({ select: { id: true, name: true, ownerId: true, backgroundUrl: true, logoUrl: true } });
  console.log("\nProjects:", projects.map(p => ({
    id: p.id,
    name: p.name,
    ownerId: p.ownerId,
    hasBg: !!p.backgroundUrl,
    bgLength: p.backgroundUrl?.length,
    bgStart: p.backgroundUrl ? p.backgroundUrl.substring(0, 100) : null,
    hasLogo: !!p.logoUrl
  })));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
