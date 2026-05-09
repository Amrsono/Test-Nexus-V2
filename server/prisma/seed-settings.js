const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const settings = [
    { key: 'VODAFONE_NUMBER', value: '01012345678' },
    { key: 'PAYPAL_EMAIL', value: 'payments@testnexus.com' },
    { key: 'PAYONEER_EMAIL', value: 'payments@testnexus.com' },
    { key: 'SUBSCRIPTION_COST', value: '100' }
  ];

  for (const s of settings) {
    await prisma.systemSettings.upsert({
      where: { key: s.key },
      update: {},
      create: s
    });
  }

  console.log('Default settings seeded successfully.');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
