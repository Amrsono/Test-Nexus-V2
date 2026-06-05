const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        testSuites: {
          include: {
            testCases: true
          }
        }
      }
    });

    console.log(`Found ${projects.length} projects:`);
    for (const p of projects) {
      console.log(`\nProject: ${p.name} (${p.id})`);
      const suites = p.testSuites;
      console.log(`  Suites: ${suites.length}`);
      
      const cases = suites.flatMap(s => s.testCases);
      console.log(`  Total Test Cases: ${cases.length}`);
      
      const statusCounts = {};
      cases.forEach(c => {
        statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
      });
      console.log('  Status Breakdown:', statusCounts);
      
      // Let's print the details of the test cases to see their IDs and statuses
      console.log('  Test Case Details (first 10):');
      cases.slice(0, 10).forEach(c => {
        console.log(`    - [${c.id}] ${c.summary.substring(0, 30)}... Status: ${c.status}, UI: ${c.checkUi}, Build: ${c.checkOrderBuild}`);
      });
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
