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
    const bdSheet = workbook.addWorksheet('Burndown Chart');
    
    bdSheet.columns = [
      { header: 'Epic', key: 'epic', width: 35 },
      { header: 'CJT release', key: 'release', width: 15 },
      { header: 'Duration', key: 'duration', width: 15 },
      { header: 'Journeys', key: 'journeys', width: 12 },
      { header: 'Week 1', key: 'w1', width: 10 },
      { header: 'Week 2', key: 'w2', width: 10 },
      { header: 'Week 3', key: 'w3', width: 10 },
      { header: 'Week 4', key: 'w4', width: 10 },
      { header: 'Week 5', key: 'w5', width: 10 },
      { header: 'Week 6', key: 'w6', width: 10 },
      { header: 'Week 7', key: 'w7', width: 10 },
      { header: 'Week 8', key: 'w8', width: 10 }
    ];

    // Style Burndown Chart Header Row
    const bdHeader = bdSheet.getRow(1);
    bdHeader.height = 32;
    for (let c = 1; c <= 12; c++) {
      const cell = bdHeader.getCell(c);
      cell.font = { bold: true, color: { argb: headerFontColor }, size: 10 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerBgColor } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    }

    // Populate Weekly Epic rows
    const weeklyTotalsMap = {};
    for (let w = 1; w <= 8; w++) {
      weeklyTotalsMap[`w${w}`] = 0;
    }
    let totalJourneysSum = 0;

    moduleList.forEach((mod, idx) => {
      const rowNum = 2 + idx;
      const totalEpicCases = testCases.filter(c => (c.module || 'General') === mod).length;
      totalJourneysSum += totalEpicCases;
      
      const rowData = {
        epic: mod,
        journeys: { formula: `COUNTIF('Execution Tracker'!$D:$D, A${rowNum})`, result: totalEpicCases }
      };

      // If project has start date, pre-calculate actual remaining cases at the end of each completed week
      if (project && project.startDate) {
        const startDate = new Date(project.startDate);
        
        for (let w = 1; w <= 8; w++) {
          const weekEndDate = new Date(startDate.getTime() + w * 7 * 24 * 60 * 60 * 1000);
          if (weekEndDate <= new Date()) {
            const completedUpToWeek = testCases.filter(c => 
              (c.module || 'General') === mod && 
              c.status !== 'PENDING' && 
              new Date(c.updatedAt) <= weekEndDate
            ).length;
            const remaining = Math.max(0, totalEpicCases - completedUpToWeek);
            rowData[`w${w}`] = remaining;
            weeklyTotalsMap[`w${w}`] += remaining;
          } else {
            rowData[`w${w}`] = ''; // blank for future weeks
          }
        }
      } else {
        for (let w = 1; w <= 8; w++) {
          rowData[`w${w}`] = ''; // blank if no startDate
        }
      }

      const addedRow = bdSheet.addRow(rowData);
      addedRow.height = 22;

      // Apply styling and thin borders
      for (let c = 1; c <= 12; c++) {
        const cell = addedRow.getCell(c);
        cell.border = thinBorder;
        cell.alignment = { vertical: 'middle', horizontal: c === 1 ? 'left' : 'center' };
        cell.font = { size: 10 };
        if (c >= 4) {
          cell.numFmt = '#,##0';
        }
      }
    });

    // Add Weekly Sum Totals Row
    const bdTotalRow = 2 + moduleList.length;
    const bdTRow = bdSheet.getRow(bdTotalRow);
    bdTRow.height = 24;
    bdTRow.getCell(1).value = 'Total';
    bdTRow.getCell(4).value = { formula: `SUM(D2:D${bdTotalRow-1})`, result: totalJourneysSum };
    
    for (let w = 1; w <= 8; w++) {
      const colLetter = getColumnLetter(4 + w); // E, F, G, H, I, J, K, L
      const formulaObj = { formula: `SUM(${colLetter}2:${colLetter}${bdTotalRow-1})` };
      if (project && project.startDate) {
        const startDate = new Date(project.startDate);
        const weekEndDate = new Date(startDate.getTime() + w * 7 * 24 * 60 * 60 * 1000);
        if (weekEndDate <= new Date()) {
          formulaObj.result = weeklyTotalsMap[`w${w}`];
        }
      }
      bdTRow.getCell(4 + w).value = formulaObj;
    }

    bdTRow.font = { bold: true };
    for (let c = 1; c <= 12; c++) {
      const cell = bdTRow.getCell(c);
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'double', color: { argb: 'FF000000' } }
      };
      cell.alignment = { vertical: 'middle', horizontal: c === 1 ? 'left' : 'center' };
      if (c >= 4) {
        cell.numFmt = '#,##0';
      }
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

module.exports = router;
