/**
 * One-time fix: assign ownerId to any projects that have ownerId = null
 * by looking at which user created content inside them (via subscriptionRequests/assignments),
 * or by prompting manually.
 * 
 * Simple approach: assign all null-owner projects to the first non-admin user found,
 * OR you can just delete them if they're test data.
 * 
 * Run with: node scratch/fixOrphanedProjects.js
 */
require('dotenv').config({ path: '../server/.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Find all projects with no owner
  const orphans = await prisma.project.findMany({
    where: { ownerId: null },
    include: { _count: { select: { testSuites: true } } }
  });

  console.log(`Found ${orphans.length} ownerless project(s):`);
  orphans.forEach(p => console.log(`  - "${p.name}" (id: ${p.id}, suites: ${p._count.testSuites})`));

  if (orphans.length === 0) {
    console.log('Nothing to fix!');
    return;
  }

  // Find all users
  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true } });
  console.log('\nUsers in system:');
  users.forEach((u, i) => console.log(`  [${i}] ${u.name} <${u.email}> (${u.role})`));

  // Assign each orphan to the admin (index 0 sorted by ADMIN role) or first user
  const admin = users.find(u => u.role === 'ADMIN');
  const targetUser = admin || users[0];
  
  if (!targetUser) {
    console.log('No users found to assign to.');
    return;
  }

  console.log(`\nAssigning all orphaned projects to: ${targetUser.name} (${targetUser.email})`);

  for (const p of orphans) {
    await prisma.project.update({
      where: { id: p.id },
      data: { ownerId: targetUser.id }
    });
    console.log(`  ✓ Assigned "${p.name}" to ${targetUser.name}`);
  }

  console.log('\nDone! All ownerless projects have been assigned.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
