const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { generateInsights } = require('../services/aiAdvisor');
const { auth } = require('../middleware/auth');

router.use(auth);

// Get recent insights for a project
router.get('/', async (req, res) => {
  const { projectId } = req.query;
  try {
    const userProjects = await prisma.project.findMany({
      where: req.user.role === 'ADMIN' ? {} : { ownerId: req.user.id },
      select: { id: true }
    });
    const userProjectIds = userProjects.map(p => p.id);

    const insights = await prisma.insight.findMany({
      where: projectId 
        ? { projectId, projectId: { in: userProjectIds } } 
        : { projectId: { in: userProjectIds } },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Trigger new AI analysis for a project
router.post('/analyze', async (req, res) => {
  const { projectId } = req.body;
  if (!projectId) return res.status(400).json({ error: 'Project ID is required' });
  
  try {
    // Check project ownership
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'You do not own this project' });
    }

    const insights = await generateInsights(projectId);
    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
