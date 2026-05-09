const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });
const { auth } = require('../middleware/auth');

// Apply auth to all routes
router.use(auth);

// Get all projects
router.get('/', async (req, res) => {
  try {
    const where = req.user.role === 'ADMIN' ? {} : { ownerId: req.user.id };
    const projects = await prisma.project.findMany({
      where,
      include: { _count: { select: { testSuites: true } } },
      orderBy: { createdAt: 'asc' }
    });
    res.json(projects);
  } catch (error) {
    console.error('Fetch Projects Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new project
router.post('/', async (req, res) => {
  const { name, themeColor, startDate, goLiveDate } = req.body;
  
  console.log(`[Production] Attempting to create project: "${name}"`);
  
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  try {
    // Robust date parsing
    const parseDate = (d) => {
      if (!d) return null;
      const date = new Date(d);
      return isNaN(date.getTime()) ? null : date;
    };

    const project = await prisma.project.create({
      data: { 
        name: name.trim(), 
        themeColor: themeColor || '#f8fafc',
        startDate: parseDate(startDate),
        goLiveDate: parseDate(goLiveDate),
        ownerId: req.user.id
      }
    });
    console.log(`[Production] Project created successfully: ${project.id}`);
    res.json(project);
  } catch (error) {
    console.error('[Production] Create Project Error:', error);
    // Return a clean error message to the frontend
    let msg = error.message;
    if (error.code === 'P2002') msg = 'A project with this name already exists.';
    if (error.message.includes('PrismaClientInitializationError')) msg = 'Database connection failed. Please check environment variables.';
    
    res.status(500).json({ error: msg });
  }
});

// Update project settings (color/dates/name) - JSON ONLY
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, themeColor, startDate, goLiveDate, backgroundUrl, logoUrl } = req.body;
  
  let updateData = {};
  if (name !== undefined) updateData.name = name;
  if (themeColor !== undefined) updateData.themeColor = themeColor;
  if (backgroundUrl !== undefined) updateData.backgroundUrl = backgroundUrl;
  if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
  
  if (startDate !== undefined) {
    updateData.startDate = startDate ? new Date(startDate) : null;
  }
  if (goLiveDate !== undefined) {
    updateData.goLiveDate = goLiveDate ? new Date(goLiveDate) : null;
  }

  try {
    const updated = await prisma.project.update({
      where: { id },
      data: updateData
    });
    res.json(updated);
  } catch (error) {
    console.error('Project Update Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update project logo - MULTIPART ONLY
router.patch('/:id/logo', upload.single('logo'), async (req, res) => {
  const { id } = req.params;
  
  if (!req.file) {
    return res.status(400).json({ error: 'No logo file provided' });
  }

  const base64Logo = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

  try {
    const updated = await prisma.project.update({
      where: { id },
      data: { logoUrl: base64Logo }
    });
    res.json(updated);
  } catch (error) {
    console.error('Logo Update Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update project background - MULTIPART ONLY
router.patch('/:id/background', upload.single('background'), async (req, res) => {
  const { id } = req.params;
  
  if (!req.file) {
    return res.status(400).json({ error: 'No background file provided' });
  }

  const base64Bg = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

  try {
    const updated = await prisma.project.update({
      where: { id },
      data: { backgroundUrl: base64Bg }
    });
    res.json(updated);
  } catch (error) {
    console.error('Background Update Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Master Reset: Zero out all scenarios, suites, defects, and insights for a project
router.post('/:id/reset', async (req, res) => {
  const { id: projectId } = req.params;

  try {
    // Check if project exists and ownership
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    
    if (project.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'You do not own this project' });
    }

    // Find all test suites for the project
    const suites = await prisma.testSuite.findMany({ where: { projectId } });
    const suiteIds = suites.map(s => s.id);

    // Find all test cases for those suites
    const cases = await prisma.testCase.findMany({ where: { suiteId: { in: suiteIds } } });
    const caseIds = cases.map(c => c.id);

    // Delete in order to respect foreign keys
    await prisma.assignment.deleteMany({ where: { testCaseId: { in: caseIds } } });
    await prisma.defect.deleteMany({ where: { projectId } });
    await prisma.insight.deleteMany({ where: { projectId } });
    await prisma.testCase.deleteMany({ where: { suiteId: { in: suiteIds } } });
    await prisma.testSuite.deleteMany({ where: { projectId } });

    res.json({ message: 'Project scenarios reset successfully' });
  } catch (error) {
    console.error('Project Reset Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete an entire project
router.delete('/:id', async (req, res) => {
  const { id: projectId } = req.params;

  try {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (project.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'You do not own this project' });
    }

    const suites = await prisma.testSuite.findMany({ where: { projectId } });
    const suiteIds = suites.map(s => s.id);
    const cases = await prisma.testCase.findMany({ where: { suiteId: { in: suiteIds } } });
    const caseIds = cases.map(c => c.id);

    await prisma.assignment.deleteMany({ where: { testCaseId: { in: caseIds } } });
    await prisma.defect.deleteMany({ where: { projectId } });
    await prisma.insight.deleteMany({ where: { projectId } });
    await prisma.testCase.deleteMany({ where: { suiteId: { in: suiteIds } } });
    await prisma.testSuite.deleteMany({ where: { projectId } });
    await prisma.project.delete({ where: { id: projectId } });

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Project Delete Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
