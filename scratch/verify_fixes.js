const prisma = require('../server/lib/prisma');

async function testProjectCreation() {
  console.log('Testing project creation with new validation logic...');
  
  const testData = [
    { name: 'Test Project 1', startDate: '2026-05-08', goLiveDate: '' },
    { name: '  Test Project 2  ', startDate: null, goLiveDate: 'invalid-date' },
    { name: '', startDate: '2026-05-08', goLiveDate: '' }, // Should fail in real route, but here we test the creation
  ];

  const parseDate = (d) => {
    if (!d) return null;
    const date = new Date(d);
    return isNaN(date.getTime()) ? null : date;
  };

  for (const data of testData) {
    try {
      if (!data.name || !data.name.trim()) {
        console.log(`Skipping invalid name: "${data.name}"`);
        continue;
      }

      console.log(`Creating project: "${data.name}" with dates: start=${data.startDate}, live=${data.goLiveDate}`);
      const project = await prisma.project.create({
        data: {
          name: data.name.trim(),
          themeColor: '#f8fafc',
          startDate: parseDate(data.startDate),
          goLiveDate: parseDate(data.goLiveDate)
        }
      });
      console.log('Created:', project.id, project.name);
      
      // Cleanup
      await prisma.project.delete({ where: { id: project.id } });
      console.log('Deleted successfully.');
    } catch (err) {
      console.error('Failed to create project:', err.message);
    }
  }

  await prisma.$disconnect();
}

testProjectCreation();
