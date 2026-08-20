const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { auth } = require('../middleware/auth');
const ExcelJS = require('exceljs');

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

// Clear all tracker data (assignments, statuses, validations) WITHOUT deleting the test cases
// Scenarios remain visible in Scenarios Lab; only execution tracking data is wiped.
router.delete('/clear-all', async (req, res) => {
  const { projectId } = req.query;
  if (!projectId) return res.status(400).json({ error: 'ProjectId is required' });

  try {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (project.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'You do not have permission to clear this project tracker' });
    }

    // Find all test cases for the project
    const testCases = await prisma.testCase.findMany({
      where: { suite: { projectId: projectId } },
      select: { id: true, customValidations: true }
    });

    if (testCases.length === 0) return res.json({ count: 0 });

    const testCaseIds = testCases.map(tc => tc.id);

    // 1. Remove all assignments (unassign everyone)
    await prisma.assignment.deleteMany({
      where: { testCaseId: { in: testCaseIds } }
    });

    // 2. Reset statuses and standard validation checks to initial state
    await prisma.testCase.updateMany({
      where: { id: { in: testCaseIds } },
      data: {
        status: 'PENDING',
        checkUi: false,
        checkOrderBuild: false,
        checkOrderCompletion: false,
        checkPcsMcpr: false
      }
    });

    // 3. Reset custom validation checked flags (requires per-record update)
    for (const tc of testCases) {
      if (tc.customValidations) {
        try {
          let cvs = typeof tc.customValidations === 'string' ? JSON.parse(tc.customValidations) : tc.customValidations;
          if (typeof cvs === 'string') cvs = JSON.parse(cvs);
          if (Array.isArray(cvs) && cvs.some(cv => cv.checked)) {
            const resetCvs = cvs.map(cv => ({ ...cv, checked: false }));
            await prisma.testCase.update({
              where: { id: tc.id },
              data: { customValidations: JSON.stringify(resetCvs) }
            });
          }
        } catch (e) {}
      }
    }

    res.json({ count: testCases.length });
  } catch (error) {
    console.error('Clear all tracker error:', error);
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

// Update all test case details (used when refining committed scenarios)
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { 
    summary, steps, expectedResult, priority, module, 
    orderBuild, orderCompletion, tcAssurance, billing, customValidations,
    checkUi, checkOrderBuild, checkOrderCompletion, checkPcsMcpr, status
  } = req.body;
  try {
    const updated = await prisma.testCase.update({
      where: { id },
      data: {
        ...(summary !== undefined && { summary }),
        ...(steps !== undefined && { steps }),
        ...(expectedResult !== undefined && { expectedResult }),
        ...(priority !== undefined && { priority }),
        ...(module !== undefined && { module }),
        ...(orderBuild !== undefined && { orderBuild }),
        ...(orderCompletion !== undefined && { orderCompletion }),
        ...(tcAssurance !== undefined && { tcAssurance }),
        ...(billing !== undefined && { billing }),
        ...(customValidations !== undefined && { 
          customValidations: typeof customValidations === 'string' ? customValidations : JSON.stringify(customValidations) 
        }),
        ...(checkUi !== undefined && { checkUi }),
        ...(checkOrderBuild !== undefined && { checkOrderBuild }),
        ...(checkOrderCompletion !== undefined && { checkOrderCompletion }),
        ...(checkPcsMcpr !== undefined && { checkPcsMcpr }),
        ...(status !== undefined && { status })
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

    const startDate = project.startDate ? new Date(project.startDate) : new Date(project.createdAt);
    const goLiveDate = project.goLiveDate
      ? new Date(project.goLiveDate)
      : new Date(startDate.getTime() + 8 * 7 * 24 * 60 * 60 * 1000);

    const allCases = project.testSuites.flatMap(suite => suite.testCases);
    const totalCases = allCases.length;

    // Calculate number of weeks
    const diffMs = goLiveDate.getTime() - startDate.getTime();
    const numWeeks = Math.max(1, Math.min(16, Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000))));
    const now = new Date();

    // Build weekly data points
    const weeklyData = [];
    for (let w = 1; w <= numWeeks; w++) {
      const weekStart = new Date(startDate.getTime() + (w - 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd   = new Date(startDate.getTime() + w       * 7 * 24 * 60 * 60 * 1000);
      weekEnd.setHours(23, 59, 59, 999);

      const idealRemaining = Math.max(0, Math.round(totalCases * (1 - w / numWeeks)));
      const isPast = weekEnd <= now;

      let executed = null, remaining = null, passed = null, blocked = null, failed = null;
      if (isPast) {
        executed  = allCases.filter(c => c.status !== 'PENDING' && new Date(c.updatedAt) <= weekEnd).length;
        passed    = allCases.filter(c => c.status === 'PASS'    && new Date(c.updatedAt) <= weekEnd).length;
        blocked   = allCases.filter(c => c.status === 'BLOCKED' && new Date(c.updatedAt) <= weekEnd).length;
        failed    = allCases.filter(c => c.status === 'FAIL'    && new Date(c.updatedAt) <= weekEnd).length;
        remaining = Math.max(0, totalCases - executed);
      }

      const label = weekStart.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

      weeklyData.push({
        name: `W${w}`,
        label,
        ideal: idealRemaining,
        actual: remaining,       // null for future weeks
        executed,                // null for future weeks
        passed,
        blocked,
        failed,
        isPast,
        isCurrentWeek: weekStart <= now && now < weekEnd
      });
    }

    res.json({
      data: weeklyData,
      meta: {
        total: totalCases,
        startDate: startDate.toISOString(),
        goLiveDate: goLiveDate.toISOString(),
        numWeeks,
        currentExecuted:  allCases.filter(c => c.status !== 'PENDING').length,
        currentPassed:    allCases.filter(c => c.status === 'PASS').length,
        currentBlocked:   allCases.filter(c => c.status === 'BLOCKED').length,
        currentFailed:    allCases.filter(c => c.status === 'FAIL').length,
        currentRemaining: Math.max(0, totalCases - allCases.filter(c => c.status !== 'PENDING').length)
      }
    });
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
      await tx.testCase.createMany({
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

      // Retrieve the newly created test cases
      const cases = await tx.testCase.findMany({
        where: { suiteId: suite.id }
      });

      return { suite, count: cases.length, testCases: cases };
    });

    res.json(result);
  } catch (error) {
    console.error('Bulk creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export test cases to Excel for Global Execution Tracker
const testCaseExcelService = require('../services/testCaseExcelService');

// Export test cases to Excel for Global Execution Tracker
router.post('/export', async (req, res) => {
  const { testCases, projectName, projectId, filterStatus, filterTester } = req.body;
  try {
    await testCaseExcelService.exportTestCases({
      testCases,
      projectName,
      projectId,
      filterStatus,
      filterTester,
      res
    });
  } catch (error) {
    console.error('Tracker Export Route Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Sync database test cases with an uploaded modified Excel sheet
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.post('/sync', upload.single('file'), async (req, res) => {
  const { projectId } = req.body;
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  if (!projectId) {
    return res.status(400).json({ error: 'ProjectId is required' });
  }

  try {
    const result = await testCaseExcelService.syncTestCases({
      projectId,
      file: req.file,
      userId: req.user.id,
      userRole: req.user.role
    });
    res.json(result);
  } catch (error) {
    console.error('Excel Sync Error:', error);
    res.status(
      error.message.includes('own') || error.message.includes('permission') ? 403 : 
      error.message.includes('not found') ? 404 : 500
    ).json({ error: error.message });
  }
});

module.exports = router;
