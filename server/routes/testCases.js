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

// Clear all journeys (hard delete) for a project
router.delete('/clear-all', async (req, res) => {
  const { projectId } = req.query;
  if (!projectId) return res.status(400).json({ error: 'ProjectId is required' });

  try {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (project.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'You do not have permission to clear this project' });
    }

    // Find all test cases for the project
    const testCases = await prisma.testCase.findMany({
      where: { suite: { projectId: projectId } },
      select: { id: true }
    });
    const testCaseIds = testCases.map(tc => tc.id);

    if (testCaseIds.length === 0) {
      return res.json({ count: 0 });
    }

    // Delete assignments first (foreign key constraint)
    await prisma.assignment.deleteMany({
      where: { testCaseId: { in: testCaseIds } }
    });

    // Delete all test cases
    const deleted = await prisma.testCase.deleteMany({
      where: { id: { in: testCaseIds } }
    });

    res.json({ count: deleted.count });
  } catch (error) {
    console.error('Clear all error:', error);
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
router.post('/export', async (req, res) => {
  const { testCases: bodyTestCases, projectName, projectId, filterStatus, filterTester } = req.body;

  try {
    let project = null;
    if (projectId) {
      project = await prisma.project.findUnique({
        where: { id: projectId }
      });
    }

    let testCases = [];
    if (bodyTestCases && Array.isArray(bodyTestCases)) {
      testCases = bodyTestCases;
    } else if (projectId) {
      const whereFilter = {
        suite: { projectId: projectId }
      };

      if (filterStatus && filterStatus !== 'ALL') {
        whereFilter.status = filterStatus;
      }

      if (filterTester && filterTester !== 'ALL') {
        whereFilter.assignments = {
          some: { testerId: filterTester }
        };
      }

      testCases = await prisma.testCase.findMany({
        where: whereFilter,
        include: { suite: true, assignments: { include: { tester: true } } },
        orderBy: { createdAt: 'desc' }
      });
    }

    if (!testCases || testCases.length === 0) {
      return res.status(400).json({ error: 'No test cases found to export' });
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Execution Tracker');

    // Create a hidden sheet for the dropdown values
    const listSheet = workbook.addWorksheet('_SystemLists', { state: 'hidden' });
    const statuses = ['PENDING', 'IN PROGRESS', 'PASS', 'FAIL', 'BLOCKED'];
    statuses.forEach((s, idx) => {
      listSheet.getCell(`A${idx + 1}`).value = s;
    });
    const boolStatuses = ['PASS', 'PENDING'];
    boolStatuses.forEach((s, idx) => {
      listSheet.getCell(`B${idx + 1}`).value = s;
    });

    // Helper to get normalized validation status columns
    const getThemeColorArgb = () => {
      if (project && project.themeColor) {
        const hex = project.themeColor.replace('#', '');
        if (hex.length === 6) return `FF${hex.toUpperCase()}`;
      }
      return 'FF1E293B'; // Default slate header
    };

    const isColorDark = (hexColor) => {
      const hex = hexColor.replace('#', '');
      if (hex.length !== 6) return true;
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness < 128;
    };

    const headerBgColor = getThemeColorArgb();
    const isDark = project && project.themeColor ? isColorDark(project.themeColor) : true;
    const headerFontColor = isDark ? 'FFFFFFFF' : 'FF000000';

    const getColumnLetter = (colIndex) => {
      let temp, letter = '';
      while (colIndex > 0) {
        temp = (colIndex - 1) % 26;
        letter = String.fromCharCode(temp + 65) + letter;
        colIndex = (colIndex - temp - 1) / 26;
      }
      return letter;
    };

    const thinBorder = {
      top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
    };

    const applyStatusCellFormatting = (cell, val) => {
      if (!val) return;
      const valUpper = String(val).toUpperCase().trim();
      if (valUpper === 'PASS') {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } }; // emerald-100
        cell.font = { color: { argb: 'FF166534' }, bold: true, size: 9 }; // emerald-800
      } else if (valUpper === 'FAIL') {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }; // red-100
        cell.font = { color: { argb: 'FF991B1B' }, bold: true, size: 9 }; // red-800
      } else if (valUpper === 'BLOCKED') {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } }; // amber-100
        cell.font = { color: { argb: 'FF92400E' }, bold: true, size: 9 }; // amber-800
      } else if (valUpper === 'IN PROGRESS') {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } }; // blue-100
        cell.font = { color: { argb: 'FF1E40AF' }, bold: true, size: 9 }; // blue-800
      } else if (valUpper === 'PENDING') {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }; // slate-100
        cell.font = { color: { argb: 'FF475569' }, bold: true, size: 9 }; // slate-600
      } else if (valUpper === 'N/A') {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }; // slate-50
        cell.font = { color: { argb: 'FF94A3B8' }, italic: true, size: 9 }; // slate-400
      }
    };

    // Gather all unique custom validation labels dynamically (excluding billing which we process cleanly)
    const customValidationLabels = new Set();
    testCases.forEach(tc => {
      if (tc.customValidations) {
        try {
          let cvs = typeof tc.customValidations === 'string' ? JSON.parse(tc.customValidations) : tc.customValidations;
          if (typeof cvs === 'string') cvs = JSON.parse(cvs);
          if (Array.isArray(cvs)) {
            cvs.forEach(cv => {
              if (cv.label && cv.id !== 'billing_check') {
                customValidationLabels.add(cv.label);
              }
            });
          }
        } catch(e) {}
      }
    });
    const customLabelsList = Array.from(customValidationLabels);

    const baseColumns = [
      { header: 'Case ID', key: 'id', width: 25 },
      { header: '#', key: 'idx', width: 6 },
      { header: 'Journey Summary', key: 'summary', width: 45 },
      { header: 'Execution Priority', key: 'priority', width: 18 },
      { header: 'Module', key: 'module', width: 22 },
      { header: 'Test Steps', key: 'steps', width: 60 },
      { header: 'Expected Outcome', key: 'expectedResult', width: 50 }
    ];

    const valColumns = [
      { header: 'UI Valid Status', key: 'checkUi', width: 16 },
      { header: 'Order Build Detail', key: 'orderBuild_detail', width: 28 },
      { header: 'Order Build Status', key: 'checkOrderBuild', width: 18 },
      { header: 'Completion Detail', key: 'orderCompletion_detail', width: 28 },
      { header: 'Completion Status', key: 'checkOrderCompletion', width: 18 },
      { header: 'T&C / Comms Detail', key: 'tcAssurance_detail', width: 28 },
      { header: 'T&C / Comms Status', key: 'checkPcsMcpr', width: 18 },
      { header: 'Billing Detail', key: 'billing_detail', width: 28 },
      { header: 'Billing Status', key: 'checkBilling', width: 18 }
    ];

    customLabelsList.forEach((label, idx) => {
      valColumns.push({ header: `${label} Detail`, key: `customDetail_${idx}`, width: 28 });
      valColumns.push({ header: `${label} Status`, key: `customStatus_${idx}`, width: 18 });
    });

    const finalColumns = [
      ...baseColumns,
      ...valColumns,
      { header: 'OVERALL JOURNEY STATUS', key: 'overall', width: 25 }
    ];

    sheet.columns = finalColumns;

    // Style Header Row
    const etHeader = sheet.getRow(1);
    etHeader.height = 32;
    for (let c = 1; c <= finalColumns.length; c++) {
      const cell = etHeader.getCell(c);
      cell.font = { bold: true, color: { argb: headerFontColor }, size: 10 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerBgColor } };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    }

    // Add Data & Style Rows
    testCases.forEach((tc, i) => {
      const rowData = {
        id: tc.id || '',
        idx: i + 1,
        summary: tc.summary || '',
        priority: tc.priority || 'MEDIUM',
        module: tc.module || 'General',
        steps: tc.steps || '',
        expectedResult: tc.expectedResult || ''
      };

      // Standard validations detail text
      rowData.orderBuild_detail = tc.orderBuild || 'N/A';
      rowData.orderCompletion_detail = tc.orderCompletion || 'N/A';
      rowData.tcAssurance_detail = tc.tcAssurance || 'N/A';
      rowData.billing_detail = tc.billing || 'N/A';

      // Standard validations statuses
      rowData.checkUi = tc.checkUi ? 'PASS' : 'PENDING';
      rowData.checkOrderBuild = tc.checkOrderBuild ? 'PASS' : 'PENDING';
      rowData.checkOrderCompletion = tc.checkOrderCompletion ? 'PASS' : 'PENDING';
      rowData.checkPcsMcpr = tc.checkPcsMcpr ? 'PASS' : 'PENDING';

      // Parse custom validations array
      let parsedCustomList = [];
      if (tc.customValidations) {
        try {
          let parsed = typeof tc.customValidations === 'string' ? JSON.parse(tc.customValidations) : tc.customValidations;
          if (typeof parsed === 'string') parsed = JSON.parse(parsed);
          parsedCustomList = Array.isArray(parsed) ? parsed : [];
        } catch(e) {}
      }

      // Check billing status inside custom validations
      const billingItem = parsedCustomList.find(cv => cv.id === 'billing_check');
      rowData.checkBilling = billingItem && billingItem.checked ? 'PASS' : 'PENDING';

      // Custom validations
      customLabelsList.forEach((label, idx) => {
        const item = parsedCustomList.find(cv => cv.label === label);
        rowData[`customDetail_${idx}`] = item && item.value ? item.value : 'N/A';
        rowData[`customStatus_${idx}`] = item && item.checked ? 'PASS' : 'PENDING';
      });

      rowData.overall = tc.status || 'PENDING';

      const row = sheet.addRow(rowData);
      row.height = 24;

      // Style and format row cells
      row.alignment = { vertical: 'middle', wrapText: true };
      
      // Let's add thin borders to all cells
      for (let c = 1; c <= finalColumns.length; c++) {
        const cell = row.getCell(c);
        cell.border = thinBorder;
        cell.font = { size: 10 };
      }

      // Add dropdowns and conditional coloring dynamically
      finalColumns.forEach((col, colIdx) => {
        const cell = row.getCell(colIdx + 1);
        const colKey = col.key;
        
        // If it's a status column
        if (
          colKey === 'checkUi' ||
          colKey === 'checkOrderBuild' ||
          colKey === 'checkOrderCompletion' ||
          colKey === 'checkPcsMcpr' ||
          colKey === 'checkBilling' ||
          colKey.startsWith('customStatus_') ||
          colKey === 'overall'
        ) {
          // Color-code the status cell!
          applyStatusCellFormatting(cell, cell.value);
          
          // Add dropdown validation!
          if (colKey === 'overall') {
            cell.dataValidation = {
              type: 'list',
              allowBlank: true,
              formulae: ['_SystemLists!$A$1:$A$5'],
              showErrorMessage: true,
              errorTitle: 'Invalid Status',
              error: 'Please select a valid status from the list.'
            };
          } else {
            cell.dataValidation = {
              type: 'list',
              allowBlank: true,
              formulae: ['_SystemLists!$B$1:$B$2'],
              showErrorMessage: true,
              errorTitle: 'Invalid Status',
              error: 'Please select a valid status from the list.'
            };
          }
        }
      });
    });

    const lastColLetter = getColumnLetter(finalColumns.length);
    sheet.autoFilter = `A1:${lastColLetter}1`;

    // === Parse project logo if uploaded ===
    let logoImageId = null;
    if (project && project.logoUrl) {
      try {
        const matches = project.logoUrl.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
        if (matches) {
          const ext = matches[1] === 'jpeg' ? 'jpg' : (matches[1] === 'svg+xml' ? 'png' : matches[1]);
          const base64Data = matches[2];
          logoImageId = workbook.addImage({
            base64: base64Data,
            extension: ext
          });
        }
      } catch (err) {
        console.error('Error parsing logo image for excel:', err);
      }
    }

    // === Add Report Worksheet ===
    const reportSheet = workbook.addWorksheet('Report');
    
    // Set manual widths for the Report columns
    const repCols = [
      { key: 'epic', width: 35 },
      { key: 'journeys', width: 12 },
      { key: 'no_runs', width: 12 },
      { key: 'executed', width: 12 },
      { key: 'passed', width: 18 },
      { key: 'in_progress', width: 14 },
      { key: 'failed', width: 16 },
      { key: 'exec_rate', width: 15 },
      { key: 'pass_rate', width: 15 },
      { key: 'data_req', width: 18 },
      { key: 'depending', width: 18 },
      { key: 'fix_date', width: 15 },
      { key: 'manual', width: 22 }
    ];
    repCols.forEach((col, idx) => {
      reportSheet.getColumn(idx + 1).width = col.width;
    });

    // Build Premium Executive Banner
    if (logoImageId) {
      reportSheet.addImage(logoImageId, {
        tl: { col: 0.1, row: 0.8 },
        ext: { width: 80, height: 80 }
      });
    }

    // Title text
    const titleCell = reportSheet.getCell('C2');
    titleCell.value = `${projectName.toUpperCase()} - EXECUTIVE EXECUTION DASHBOARD`;
    titleCell.font = { bold: true, size: 16, color: { argb: headerBgColor === 'FFFFFFFF' ? 'FF1E293B' : headerBgColor } };

    const subtitleCell = reportSheet.getCell('C3');
    subtitleCell.value = `Generated: ${new Date().toLocaleString()} | Total Test Cases: ${testCases.length}`;
    subtitleCell.font = { italic: true, size: 10, color: { argb: 'FF64748B' } };

    // Set Table Headers at row 5
    const repHeaderLabels = [
      'Epic / Module', 'Total Journeys', 'Pending', 'Executed', 'Passed', 
      'In Progress', 'Blocked/Failed', 'Execution Rate', 'Pass Rate',
      'Data Required', 'Depending On', 'Fix Date', 'Manual Intervention'
    ];
    const repHeaderRow = reportSheet.getRow(5);
    repHeaderRow.height = 28;
    repHeaderLabels.forEach((label, idx) => {
      const cell = repHeaderRow.getCell(idx + 1);
      cell.value = label;
      cell.font = { bold: true, color: { argb: headerFontColor }, size: 10 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerBgColor } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        bottom: { style: 'medium', color: { argb: 'FF000000' } }
      };
    });

    // Extract unique modules
    const modules = new Set();
    testCases.forEach(tc => { modules.add(tc.module || 'General'); });
    const moduleList = Array.from(modules);

    let startRow = 6;
    const overCol = lastColLetter;
    moduleList.forEach((mod, idx) => {
      const rowNum = startRow + idx;
      const row = reportSheet.getRow(rowNum);
      row.height = 22;

      // Pre-calculate metric details for this module
      const epics = testCases.filter(c => (c.module || 'General') === mod);
      const journeysCount = epics.length;
      const noRunsCount = epics.filter(c => c.status === 'PENDING').length;
      const executedCount = epics.filter(c => c.status !== 'PENDING').length;
      const passedCount = epics.filter(c => c.status === 'PASS').length;
      const inProgressCount = epics.filter(c => c.status === 'IN PROGRESS').length;
      const failedCount = epics.filter(c => c.status === 'FAIL' || c.status === 'BLOCKED').length;
      const execRate = journeysCount > 0 ? (executedCount / journeysCount) : 0;
      const passRate = journeysCount > 0 ? (passedCount / journeysCount) : 0;
      
      // Values with live formula + pre-calculated cached results for quick loading
      row.getCell(1).value = mod; // Epic
      row.getCell(2).value = { formula: `COUNTIF('Execution Tracker'!$D:$D, A${rowNum})`, result: journeysCount }; // Journeys
      row.getCell(3).value = { formula: `COUNTIFS('Execution Tracker'!$D:$D, A${rowNum}, 'Execution Tracker'!$${overCol}:$${overCol}, "PENDING")`, result: noRunsCount }; // Pending
      row.getCell(4).value = { formula: `COUNTIFS('Execution Tracker'!$D:$D, A${rowNum}, 'Execution Tracker'!$${overCol}:$${overCol}, "<>PENDING")`, result: executedCount }; // Executed
      row.getCell(5).value = { formula: `COUNTIFS('Execution Tracker'!$D:$D, A${rowNum}, 'Execution Tracker'!$${overCol}:$${overCol}, "PASS")`, result: passedCount }; // Passed
      row.getCell(6).value = { formula: `COUNTIFS('Execution Tracker'!$D:$D, A${rowNum}, 'Execution Tracker'!$${overCol}:$${overCol}, "IN PROGRESS")`, result: inProgressCount }; // In Progress
      row.getCell(7).value = { formula: `COUNTIFS('Execution Tracker'!$D:$D, A${rowNum}, 'Execution Tracker'!$${overCol}:$${overCol}, "FAIL") + COUNTIFS('Execution Tracker'!$D:$D, A${rowNum}, 'Execution Tracker'!$${overCol}:$${overCol}, "BLOCKED")`, result: failedCount }; // Blocked/Failed
      row.getCell(8).value = { formula: `IF(B${rowNum}>0, D${rowNum}/B${rowNum}, 0)`, result: execRate }; // Execution Rate
      row.getCell(9).value = { formula: `IF(B${rowNum}>0, E${rowNum}/B${rowNum}, 0)`, result: passRate }; // Pass Rate
      
      // Styling and number formatting
      row.getCell(8).numFmt = '0%';
      row.getCell(9).numFmt = '0%';
      
      // Apply alignment and thin borders
      for (let c = 1; c <= 13; c++) {
        const cell = row.getCell(c);
        cell.border = thinBorder;
        cell.alignment = { vertical: 'middle', horizontal: c === 1 ? 'left' : (c > 9 ? 'left' : 'center') };
        cell.font = { size: 10 };
      }
    });

    // Add Accounting Total Row
    const totalRowNum = startRow + moduleList.length;
    const tRow = reportSheet.getRow(totalRowNum);
    tRow.height = 24;

    const totalJourneys = testCases.length;
    const totalNoRuns = testCases.filter(c => c.status === 'PENDING').length;
    const totalExecuted = testCases.filter(c => c.status !== 'PENDING').length;
    const totalPassed = testCases.filter(c => c.status === 'PASS').length;
    const totalInProgress = testCases.filter(c => c.status === 'IN PROGRESS').length;
    const totalFailed = testCases.filter(c => c.status === 'FAIL' || c.status === 'BLOCKED').length;
    const totalExecRate = totalJourneys > 0 ? (totalExecuted / totalJourneys) : 0;
    const totalPassRate = totalJourneys > 0 ? (totalPassed / totalJourneys) : 0;

    tRow.getCell(1).value = 'Total';
    tRow.getCell(2).value = { formula: `SUM(B6:B${totalRowNum - 1})`, result: totalJourneys };
    tRow.getCell(3).value = { formula: `SUM(C6:C${totalRowNum - 1})`, result: totalNoRuns };
    tRow.getCell(4).value = { formula: `SUM(D6:D${totalRowNum - 1})`, result: totalExecuted };
    tRow.getCell(5).value = { formula: `SUM(E6:E${totalRowNum - 1})`, result: totalPassed };
    tRow.getCell(6).value = { formula: `SUM(F6:F${totalRowNum - 1})`, result: totalInProgress };
    tRow.getCell(7).value = { formula: `SUM(G6:G${totalRowNum - 1})`, result: totalFailed };
    tRow.getCell(8).value = { formula: `IF(B${totalRowNum}>0, D${totalRowNum}/B${totalRowNum}, 0)`, result: totalExecRate }; // Total Execution Rate
    tRow.getCell(9).value = { formula: `IF(B${totalRowNum}>0, E${totalRowNum}/B${totalRowNum}, 0)`, result: totalPassRate }; // Total Pass Rate
    
    tRow.getCell(8).numFmt = '0%';
    tRow.getCell(9).numFmt = '0%';
    
    // Style Total Row with brand background fill and double underline accounting border
    tRow.font = { bold: true, color: { argb: headerFontColor } };
    for (let c = 1; c <= 13; c++) {
      const cell = tRow.getCell(c);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerBgColor } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'double', color: { argb: 'FF000000' } }
      };
      cell.alignment = { vertical: 'middle', horizontal: c === 1 ? 'left' : (c > 9 ? 'left' : 'center') };
    }

    // === Add Burndown Chart Worksheet ===
    // Proper time-series burndown: one row per week, columns for all KPIs
    const bdSheet = workbook.addWorksheet('Burndown Chart');

    // Column widths
    const bdCols = [
      { width: 10 },  // A: Week
      { width: 22 },  // B: Date Range
      { width: 16 },  // C: Total Journeys
      { width: 18 },  // D: Ideal Remaining
      { width: 20 },  // E: Cumulative Executed
      { width: 18 },  // F: Actual Remaining
      { width: 14 },  // G: Blocked
      { width: 14 },  // H: Passed
      { width: 14 },  // I: Failed
    ];
    bdCols.forEach((col, idx) => {
      bdSheet.getColumn(idx + 1).width = col.width;
    });

    // ── Banner row 1: KPI column headers ────────────────────────────────────
    const bdHeaderLabels = [
      'Week', 'Period', 'Total Journeys', 'Ideal Remaining',
      'Executed (Cumul.)', 'Actual Remaining', 'Blocked', 'Passed', 'Failed'
    ];
    const bdHeaderRow = bdSheet.getRow(1);
    bdHeaderRow.height = 32;
    bdHeaderLabels.forEach((label, idx) => {
      const cell = bdHeaderRow.getCell(idx + 1);
      cell.value = label;
      cell.font = { bold: true, color: { argb: headerFontColor }, size: 10 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerBgColor } };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    });

    // ── Derive week boundaries from project dates ────────────────────────────
    const totalJourneysAll = testCases.length;
    const now = new Date();

    let bdStartDate = project && project.startDate ? new Date(project.startDate) : null;
    let bdEndDate   = project && project.goLiveDate ? new Date(project.goLiveDate) : null;

    // Calculate number of weeks to display (max 16, min 1)
    let numWeeks = 8;
    if (bdStartDate && bdEndDate) {
      const diffMs = bdEndDate.getTime() - bdStartDate.getTime();
      numWeeks = Math.max(1, Math.min(16, Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000))));
    }

    // Format helper: "15 Jun"
    const fmtDate = (d) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

    // ── Data rows: one per week ─────────────────────────────────────────────
    let dataRowIndex = 2;
    for (let w = 1; w <= numWeeks; w++) {
      const row = bdSheet.getRow(dataRowIndex);
      row.height = 22;

      // Week boundaries
      let weekStart, weekEnd;
      if (bdStartDate) {
        weekStart = new Date(bdStartDate.getTime() + (w - 1) * 7 * 24 * 60 * 60 * 1000);
        weekEnd   = new Date(bdStartDate.getTime() + w       * 7 * 24 * 60 * 60 * 1000);
      }

      // Ideal remaining = linear burndown from total to 0
      const idealRemaining = Math.max(0, Math.round(totalJourneysAll * (1 - w / numWeeks)));

      // Actual metrics — only filled for weeks that have already ended
      const weekIsPast = weekEnd && weekEnd <= now;
      let executed = null, remaining = null, blocked = null, passed = null, failed = null;

      if (weekIsPast && bdStartDate) {
        executed  = testCases.filter(c => c.status !== 'PENDING' && new Date(c.updatedAt) <= weekEnd).length;
        blocked   = testCases.filter(c => c.status === 'BLOCKED'  && new Date(c.updatedAt) <= weekEnd).length;
        passed    = testCases.filter(c => c.status === 'PASS'     && new Date(c.updatedAt) <= weekEnd).length;
        failed    = testCases.filter(c => c.status === 'FAIL'     && new Date(c.updatedAt) <= weekEnd).length;
        remaining = Math.max(0, totalJourneysAll - executed);
      }

      // Fill cells
      row.getCell(1).value = `Week ${w}`;
      row.getCell(2).value = (weekStart && weekEnd)
        ? `${fmtDate(weekStart)} – ${fmtDate(weekEnd)}`
        : `Week ${w}`;
      row.getCell(3).value = totalJourneysAll;
      row.getCell(4).value = idealRemaining;
      row.getCell(5).value = executed   !== null ? executed   : '';
      row.getCell(6).value = remaining  !== null ? remaining  : '';
      row.getCell(7).value = blocked    !== null ? blocked    : '';
      row.getCell(8).value = passed     !== null ? passed     : '';
      row.getCell(9).value = failed     !== null ? failed     : '';

      // Styling
      for (let c = 1; c <= 9; c++) {
        const cell = row.getCell(c);
        cell.border = thinBorder;
        cell.alignment = { vertical: 'middle', horizontal: c <= 2 ? 'left' : 'center' };
        cell.font = { size: 10 };
        if (c >= 3) cell.numFmt = '#,##0';
      }

      // Highlight current week light yellow
      const isCurrentWeek = weekStart && weekEnd && weekStart <= now && now < weekEnd;
      if (isCurrentWeek) {
        for (let c = 1; c <= 9; c++) {
          row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF9C4' } };
        }
      }

      // Colour the Actual Remaining cell: green if < ideal, red if >
      if (remaining !== null) {
        const remCell = row.getCell(6);
        if (remaining <= idealRemaining) {
          remCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } }; // green-100
          remCell.font = { size: 10, bold: true, color: { argb: 'FF065F46' } };
        } else {
          remCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }; // red-100
          remCell.font = { size: 10, bold: true, color: { argb: 'FF991B1B' } };
        }
      }

      dataRowIndex++;
    }

    // ── Summary / Current Status row ────────────────────────────────────────
    const bdSumRow = bdSheet.getRow(dataRowIndex);
    bdSumRow.height = 26;

    const currentExecuted  = testCases.filter(c => c.status !== 'PENDING').length;
    const currentBlocked   = testCases.filter(c => c.status === 'BLOCKED').length;
    const currentPassed    = testCases.filter(c => c.status === 'PASS').length;
    const currentFailed    = testCases.filter(c => c.status === 'FAIL').length;
    const currentRemaining = Math.max(0, totalJourneysAll - currentExecuted);

    bdSumRow.getCell(1).value = 'NOW';
    bdSumRow.getCell(2).value = fmtDate(now);
    bdSumRow.getCell(3).value = totalJourneysAll;
    bdSumRow.getCell(4).value = '—';          // no ideal for "now"
    bdSumRow.getCell(5).value = currentExecuted;
    bdSumRow.getCell(6).value = currentRemaining;
    bdSumRow.getCell(7).value = currentBlocked;
    bdSumRow.getCell(8).value = currentPassed;
    bdSumRow.getCell(9).value = currentFailed;

    bdSumRow.font = { bold: true, color: { argb: headerFontColor } };
    for (let c = 1; c <= 9; c++) {
      const cell = bdSumRow.getCell(c);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerBgColor } };
      cell.border = {
        top:    { style: 'thin',   color: { argb: 'FF000000' } },
        bottom: { style: 'double', color: { argb: 'FF000000' } }
      };
      cell.alignment = { vertical: 'middle', horizontal: c <= 2 ? 'left' : 'center' };
      if (c >= 3 && c !== 4) cell.numFmt = '#,##0';
    }

    // Save & stream workbook
    const safeName = (projectName || 'Test_Nexus').replace(/[^a-z0-9]/gi, '_');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}_Execution_Tracker.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
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
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'You do not own this project' });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const sheet = workbook.getWorksheet('Execution Tracker');
    if (!sheet) {
      return res.status(400).json({ error: 'Invalid file format: "Execution Tracker" sheet not found.' });
    }

    const headers = [];
    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell, colNumber) => {
      headers[colNumber] = cell.value ? String(cell.value).trim() : '';
    });

    const getCellValue = (cell) => {
      if (!cell) return '';
      if (cell.value && typeof cell.value === 'object') {
        if (cell.value.result !== undefined) return String(cell.value.result).trim();
        if (cell.value.text !== undefined) return String(cell.value.text).trim();
        return String(cell.value).trim();
      }
      return cell.value ? String(cell.value).trim() : '';
    };

    const getValByHeader = (row, headerName) => {
      const idx = headers.indexOf(headerName);
      if (idx === -1) return '';
      return getCellValue(row.getCell(idx));
    };

    // Load existing test cases to know which ones to update vs create
    const existingTestCases = await prisma.testCase.findMany({
      where: { suite: { projectId } }
    });
    const existingIds = new Set(existingTestCases.map(tc => tc.id));

    // Find or create a default suite for new cases imported via sync
    let defaultSuite = await prisma.testSuite.findFirst({
      where: { projectId }
    });
    if (!defaultSuite) {
      defaultSuite = await prisma.testSuite.create({
        data: {
          name: 'Excel Import Suite',
          description: 'Default suite for Excel imports',
          projectId
        }
      });
    }
    const suiteId = defaultSuite.id;

    const updatedCases = [];
    const rowPromises = [];

    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return; // skip header

      const id = getCellValue(row.getCell(1));
      const summary = getValByHeader(row, 'Journey Summary');

      // Skip row if both Case ID and Summary are empty (blank rows at end of sheet)
      if (!id && !summary) return;

      const priority = getValByHeader(row, 'Execution Priority');
      const module = getValByHeader(row, 'Module');
      const steps = getValByHeader(row, 'Test Steps');
      const expectedResult = getValByHeader(row, 'Expected Outcome');
      const checkUi = String(getValByHeader(row, 'UI Valid Status')).toUpperCase().trim() === 'PASS';
      const orderBuild = getValByHeader(row, 'Order Build Detail');
      const checkOrderBuild = String(getValByHeader(row, 'Order Build Status')).toUpperCase().trim() === 'PASS';
      const orderCompletion = getValByHeader(row, 'Completion Detail');
      const checkOrderCompletion = String(getValByHeader(row, 'Completion Status')).toUpperCase().trim() === 'PASS';
      const tcAssurance = getValByHeader(row, 'T&C / Comms Detail');
      const checkPcsMcpr = String(getValByHeader(row, 'T&C / Comms Status')).toUpperCase().trim() === 'PASS';
      const billing = getValByHeader(row, 'Billing Detail');
      const checkBilling = String(getValByHeader(row, 'Billing Status')).toUpperCase().trim() === 'PASS';
      let status = String(getValByHeader(row, 'OVERALL JOURNEY STATUS')).toUpperCase().trim() || 'PENDING';
      if (!['PENDING', 'IN PROGRESS', 'PASS', 'FAIL', 'BLOCKED'].includes(status)) {
        status = 'PENDING';
      }

      // Parse custom validations
      const customValidations = [];
      
      // Billing Check is a custom validation in db representation
      if (billing && billing !== 'N/A') {
        customValidations.push({
          id: 'billing_check',
          label: 'Billing Check',
          value: billing,
          checked: checkBilling
        });
      }

      headers.forEach((h, idx) => {
        if (h && h.endsWith(' Detail') && 
            h !== 'Order Build Detail' && 
            h !== 'Completion Detail' && 
            h !== 'T&C / Comms Detail' && 
            h !== 'Billing Detail'
        ) {
          const label = h.substring(0, h.length - 7); // remove ' Detail'
          const detailValue = getCellValue(row.getCell(idx));
          const statusHeader = `${label} Status`;
          const statusIdx = headers.indexOf(statusHeader);
          let checked = false;
          if (statusIdx !== -1) {
            checked = String(getCellValue(row.getCell(statusIdx))).toUpperCase().trim() === 'PASS';
          }
          if (detailValue && detailValue !== 'N/A') {
            customValidations.push({
              id: `custom_${label.replace(/\s+/g, '_')}`,
              label: label,
              value: detailValue,
              checked: checked
            });
          }
        }
      });

      const isExisting = id && existingIds.has(id);

      if (isExisting) {
        rowPromises.push(
          prisma.testCase.update({
            where: { id },
            data: {
              ...(summary && { summary }),
              ...(priority && { priority }),
              ...(module && { module }),
              ...(steps && { steps }),
              ...(expectedResult && { expectedResult }),
              checkUi,
              ...(orderBuild && { orderBuild }),
              checkOrderBuild,
              ...(orderCompletion && { orderCompletion }),
              checkOrderCompletion,
              ...(tcAssurance && { tcAssurance }),
              checkPcsMcpr,
              ...(billing && { billing }),
              customValidations: customValidations.length > 0 ? JSON.stringify(customValidations) : null,
              status
            }
          }).then(tc => {
            updatedCases.push(tc);
          }).catch(err => {
            console.error(`Failed to update case ID ${id}:`, err.message);
          })
        );
      } else {
        rowPromises.push(
          prisma.testCase.create({
            data: {
              summary: summary || 'Unnamed Journey',
              priority: priority || 'MEDIUM',
              module: module || 'General',
              steps: steps || 'No steps provided.',
              expectedResult: expectedResult || 'Expected outcome not defined.',
              checkUi,
              orderBuild: orderBuild || 'N/A',
              checkOrderBuild,
              orderCompletion: orderCompletion || 'N/A',
              checkOrderCompletion,
              tcAssurance: tcAssurance || 'N/A',
              checkPcsMcpr,
              billing: billing || 'N/A',
              customValidations: customValidations.length > 0 ? JSON.stringify(customValidations) : null,
              status: status || 'PENDING',
              suiteId
            }
          }).then(tc => {
            updatedCases.push(tc);
          }).catch(err => {
            console.error(`Failed to create case:`, err.message);
          })
        );
      }
    });

    await Promise.all(rowPromises);
    res.json({ success: true, count: updatedCases.length, testCases: updatedCases });

  } catch (error) {
    console.error('Excel Sync Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
