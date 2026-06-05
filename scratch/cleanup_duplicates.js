const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const projectId = 'cmpl5pm8w0001j067f15sagag';
  console.log(`Starting cleanup of duplicate test cases for project ${projectId}...`);

  try {
    const suites = await prisma.testSuite.findMany({
      where: { projectId },
      include: { testCases: true }
    });

    let totalDeleted = 0;

    for (const suite of suites) {
      console.log(`Suite: ${suite.name} (${suite.id})`);
      const cases = suite.testCases;

      const summaryMap = {};
      cases.forEach(c => {
        if (!summaryMap[c.summary]) {
          summaryMap[c.summary] = [];
        }
        summaryMap[c.summary].push(c);
      });

      const idsToDelete = [];

      Object.entries(summaryMap).forEach(([summary, list]) => {
        if (list.length > 1) {
          // Sort by creation date ascending (oldest first) so we keep the original
          list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          
          // The first one is the original, the rest are duplicates
          const original = list[0];
          const duplicates = list.slice(1);

          console.log(`Summary: "${summary}"`);
          console.log(`  Keeping Original ID: ${original.id} (Created: ${original.createdAt}, Status: ${original.status})`);
          
          duplicates.forEach(dup => {
            console.log(`  Flagging Duplicate ID: ${dup.id} (Created: ${dup.createdAt}, Status: ${dup.status})`);
            idsToDelete.push(dup.id);
          });
        }
      });

      if (idsToDelete.length > 0) {
        console.log(`\nDeleting ${idsToDelete.length} duplicates from database...`);
        // First delete any assignments linked to these duplicates (to avoid constraint errors)
        await prisma.assignment.deleteMany({
          where: { testCaseId: { in: idsToDelete } }
        });
        
        // Also delete any defects linked to these duplicates (to avoid constraint errors)
        await prisma.defect.updateMany({
          where: { relatedCaseId: { in: idsToDelete } },
          data: { relatedCaseId: null }
        });

        const deleteResult = await prisma.testCase.deleteMany({
          where: { id: { in: idsToDelete } }
        });

        console.log(`Successfully deleted ${deleteResult.count} duplicate test cases.`);
        totalDeleted += deleteResult.count;
      } else {
        console.log('No duplicates found to delete in this suite.');
      }
    }

    console.log(`\nCleanup complete. Total duplicates removed: ${totalDeleted}`);
  } catch (err) {
    console.error('Error cleaning up duplicates:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
