const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing Prisma connection...');
    const projectCount = await prisma.project.count();
    console.log(`Current project count: ${projectCount}`);
    
    console.log('Attempting to create a test project...');
    const newProject = await prisma.project.create({
      data: {
        name: 'Connection Test Project',
        themeColor: '#f8fafc'
      }
    });
    console.log('Project created successfully:', newProject);
    
    // Cleanup
    await prisma.project.delete({ where: { id: newProject.id } });
    console.log('Test project deleted.');
  } catch (error) {
    console.error('Prisma Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
