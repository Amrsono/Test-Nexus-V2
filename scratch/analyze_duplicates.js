const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const projectId = 'cmpl5pm8w0001j067f15sagag';
  try {
    const suites = await prisma.testSuite.findMany({
      where: { projectId },
      include: { testCases: true }
    });

    console.log(`Project has ${suites.length} suites.`);
    for (const suite of suites) {
      console.log(`Suite: ${suite.name} (${suite.id})`);
      const cases = suite.testCases;
      console.log(`  Total Test Cases: ${cases.length}`);

      const summaryMap = {};
      cases.forEach(c => {
        if (!summaryMap[c.summary]) {
          summaryMap[c.summary] = [];
        }
        summaryMap[c.summary].push(c);
      });

      let duplicateSummaryCount = 0;
      let totalDuplicates = 0;

      Object.entries(summaryMap).forEach(([summary, list]) => {
        if (list.length > 1) {
          duplicateSummaryCount++;
          totalDuplicates += list.length;
          console.log(`\n  Duplicate summary: "${summary}" (${list.length} occurrences)`);
          list.forEach(c => {
            console.log(`    - ID: ${c.id}, Status: ${c.status}, Created: ${c.createdAt}`);
          });
        }
      });

      console.log(`\n  Summary: ${duplicateSummaryCount} unique summaries have duplicates. Total duplicate records: ${totalDuplicates}`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
