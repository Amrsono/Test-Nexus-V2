require('dotenv').config({ path: '../../.env' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Password@26', 10);
  const user = await prisma.user.upsert({
    where: { email: 'admin@testnexus.com' },
    update: { password: hash, role: 'ADMIN', subscriptionStatus: 'ACTIVE' },
    create: {
      name: 'Admin',
      email: 'admin@testnexus.com',
      password: hash,
      role: 'ADMIN',
      subscriptionStatus: 'ACTIVE'
    }
  });
  console.log('✅ Admin user ready:', user.email, '| Role:', user.role, '| Status:', user.subscriptionStatus);
  await prisma.$disconnect();
}

main().catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
