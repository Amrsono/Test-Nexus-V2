const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { auth } = require('../middleware/auth');

router.use(auth);

// Get all test cases for a project
router.get('/', async (req, res) => {
  const { projectId } = req.query;
  try {
    const userProjects = await prisma.project.findMany({
      where: req.user.role === 'ADMIN' ? {} : { ownerId: req.user.id },
      select: { id: true }
    });
    const userProjectIds = userProjects.map(p => p.id);

    if (projectId && !userProjectIds.includes(projectId)) {
      return res.status(403).json({ error: 'Access denied to this project' });
    }

    const testCases = await prisma.testCase.findMany({
      where: projectId 
        ? { suite: { projectId: projectId } } 
        : { suite: { projectId: { in: userProjectIds } } },
      include: { suite: true, assignments: { include: { tester: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(testCases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset all test cases for a project to PENDING
router.post('/reset', async (req, res) => {
  const { projectId } = req.body;
  if (!projectId) return res.status(400).json({ error: 'ProjectId is required' });

  try {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    
    if (project.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'You do not have permission to reset this project' });
    }

    const updated = await prisma.testCase.updateMany({
      where: { suite: { projectId: projectId } },
      data: {
        status: 'PENDING',
        checkUi: false,
        checkOrderBuild: false,
        checkOrderCompletion: false,
        checkPcsMcpr: false
      }
    });

    const testCasesToReset = await prisma.testCase.findMany({
      where: { suite: { projectId: projectId }, customValidations: { not: null } }
    });

    for (const tc of testCasesToReset) {
      if (tc.customValidations) {
        try {
          let cvs = typeof tc.customValidations === 'string' ? JSON.parse(tc.customValidations) : tc.customValidations;
          if (typeof cvs === 'string') cvs = JSON.parse(cvs);
          if (Array.isArray(cvs)) {
            const resetCvs = cvs.map(cv => ({ ...cv, checked: false }));
            await prisma.testCase.update({
              where: { id: tc.id },
              data: { customValidations: JSON.stringify(resetCvs) }
            });
          }
        } catch(e) {}
      }
    }

    res.json({ count: updated.count });
  } catch (error) {
    console.error('Reset error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update test case status
router.patch('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const updated = await prisma.testCase.update({
      where: { id },
      data: { status }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update manual validation checkpoints
router.patch('/:id/validations', async (req, res) => {
  const { id } = req.params;
  const { checkUi, checkOrderBuild, checkOrderCompletion, checkPcsMcpr, customValidations } = req.body;
  
  try {
    const updated = await prisma.testCase.update({
      where: { id },
      data: { 
        ...(checkUi !== undefined && { checkUi }),
        ...(checkOrderBuild !== undefined && { checkOrderBuild }),
        ...(checkOrderCompletion !== undefined && { checkOrderCompletion }),
        ...(checkPcsMcpr !== undefined && { checkPcsMcpr }),
        ...(customValidations !== undefined && { 
          customValidations: typeof customValidations === 'string' ? customValidations : JSON.stringify(customValidations) 
        })
      }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get stats for dashboard (filtered by project)
router.get('/stats', async (req, res) => {
  const { projectId } = req.query;
  try {
    const filter = projectId ? { suite: { projectId } } : {};
    const total = await prisma.testCase.count({ where: filter });
    const passed = await prisma.testCase.count({ where: { ...filter, status: 'PASS' } });
    const failed = await prisma.testCase.count({ where: { ...filter, status: 'FAIL' } });
    const blocked = await prisma.testCase.count({ where: { ...filter, status: 'BLOCKED' } });
    const pending = await prisma.testCase.count({ where: { ...filter, status: 'PENDING' } });

    res.json({ total, passed, failed, blocked, pending });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get unassigned test cases for a project
router.get('/unassigned', async (req, res) => {
  const { projectId } = req.query;
  try {
    const unassigned = await prisma.testCase.findMany({
      where: {
        suite: { projectId },
        assignments: { none: {} } // No assignments linked
      },
      include: { suite: true }
    });
    res.json(unassigned);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get burndown data for a project
router.get('/burndown', async (req, res) => {
  const { projectId } = req.query;
  if (!projectId) return res.status(400).json({ error: 'ProjectId is required' });

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { testSuites: { include: { testCases: true } } }
    });

    if (!project) return res.status(404).json({ error: 'Project not found' });

    const startDate = project.startDate || project.createdAt;
    const goLiveDate = project.goLiveDate || new Date(new Date(startDate).getTime() + 14 * 24 * 60 * 60 * 1000);
    
    const allCases = project.testSuites.flatMap(suite => suite.testCases);
    const totalCases = allCases.length;

    // Generate days array
    const days = [];
    let curr = new Date(startDate);
    curr.setHours(0,0,0,0);
    const end = new Date(goLiveDate);
    end.setHours(23,59,59,999);

    // Limit to reasonable range to avoid infinite loops if dates are bad
    let safetyCounter = 0;
    while (curr <= end && safetyCounter < 1000) {
      days.push(new Date(curr));
      curr.setDate(curr.getDate() + 1);
      safetyCounter++;
    }

    if (days.length === 0) days.push(new Date());

    // Calculate Ideal and Actual
    const data = days.map((day, index) => {
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      // Ideal: Linear reduction from totalCases down to 0
      const ideal = days.length > 1 
        ? Math.max(0, totalCases - (totalCases * (index / (days.length - 1))))
        : 0;

      // Actual: Total cases - cases completed UP TO this day
      const completedUpToDay = allCases.filter(c => 
        c.status !== 'PENDING' && 
        new Date(c.updatedAt) <= dayEnd
      ).length;

      const actual = Math.max(0, totalCases - completedUpToDay);

      return {
        name: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        ideal: Math.round(ideal),
        actual: Math.round(actual)
      };
    });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk create test cases (used by AI Scenario Lab)
router.post('/bulk', async (req, res) => {
  const { projectId, suiteName, testCases } = req.body;
  if (!projectId || !testCases || !Array.isArray(testCases)) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Check project ownership
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'You do not own this project' });
    }
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create or find the test suite
      const suite = await tx.testSuite.create({
        data: {
          name: suiteName,
          projectId: projectId
        }
      });

      // 2. Create all test cases
      const createdCases = await tx.testCase.createMany({
        data: testCases.map(tc => ({
          summary: String(tc.summary || 'Untitled Scenario'),
          steps: String(tc.steps || 'No steps provided'),
          expectedResult: String(tc.expectedResult || 'Expected results not defined'),
          priority: tc.priority || 'MEDIUM',
          module: tc.module || 'General',
          orderBuild: tc.orderBuild || null,
          orderCompletion: tc.orderCompletion || null,
          tcAssurance: tc.tcAssurance || null,
          billing: tc.billing || null,
          customValidations: tc.customValidations ? JSON.stringify(tc.customValidations) : null,
          checkUi: false,
          checkOrderBuild: false,
          checkOrderCompletion: false,
          checkPcsMcpr: false,
          suiteId: suite.id,
          status: 'PENDING'
        }))
      });

      return { suite, count: createdCases.count };
    });

    res.json(result);
  } catch (error) {
    console.error('Bulk creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
