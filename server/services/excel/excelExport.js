const { addBurndownSheet } = require('./excelBurndownSheet');
const prisma = require('../../lib/prisma');
const ExcelJS = require('exceljs');
const {
  getThemeColorArgb,
  isColorDark,
  getColumnLetter,
  applyStatusCellFormatting,
  getCellValue,
  getValByHeader
} = require('./excelStyles');

const exportTestCases = async ({ testCases: bodyTestCases, projectName, projectId, filterStatus, filterTester, res }) => {
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
    throw new Error('No test cases found to export');
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

  const headerBgColor = getThemeColorArgb(project);
  const isDark = project && project.themeColor ? isColorDark(project.themeColor) : true;
  const headerFontColor = isDark ? 'FFFFFFFF' : 'FF000000';

  const thinBorder = {
    top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
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

    rowData.orderBuild_detail = tc.orderBuild || 'N/A';
    rowData.orderCompletion_detail = tc.orderCompletion || 'N/A';
    rowData.tcAssurance_detail = tc.tcAssurance || 'N/A';
    rowData.billing_detail = tc.billing || 'N/A';

    rowData.checkUi = tc.checkUi ? 'PASS' : 'PENDING';
    rowData.checkOrderBuild = tc.checkOrderBuild ? 'PASS' : 'PENDING';
    rowData.checkOrderCompletion = tc.checkOrderCompletion ? 'PASS' : 'PENDING';
    rowData.checkPcsMcpr = tc.checkPcsMcpr ? 'PASS' : 'PENDING';

    let parsedCustomList = [];
    if (tc.customValidations) {
      try {
        let parsed = typeof tc.customValidations === 'string' ? JSON.parse(tc.customValidations) : tc.customValidations;
        if (typeof parsed === 'string') parsed = JSON.parse(parsed);
        parsedCustomList = Array.isArray(parsed) ? parsed : [];
      } catch(e) {}
    }

    const billingItem = parsedCustomList.find(cv => cv.id === 'billing_check');
    rowData.checkBilling = billingItem && billingItem.checked ? 'PASS' : 'PENDING';

    customLabelsList.forEach((label, idx) => {
      const item = parsedCustomList.find(cv => cv.label === label);
      rowData[`customDetail_${idx}`] = item && item.value ? item.value : 'N/A';
      rowData[`customStatus_${idx}`] = item && item.checked ? 'PASS' : 'PENDING';
    });

    rowData.overall = tc.status || 'PENDING';

    const row = sheet.addRow(rowData);
    row.height = 24;
    row.alignment = { vertical: 'middle', wrapText: true };
    
    for (let c = 1; c <= finalColumns.length; c++) {
      const cell = row.getCell(c);
      cell.border = thinBorder;
      cell.font = { size: 10 };
    }

    finalColumns.forEach((col, colIdx) => {
      const cell = row.getCell(colIdx + 1);
      const colKey = col.key;
      
      if (
        colKey === 'checkUi' ||
        colKey === 'checkOrderBuild' ||
        colKey === 'checkOrderCompletion' ||
        colKey === 'checkPcsMcpr' ||
        colKey === 'checkBilling' ||
        colKey.startsWith('customStatus_') ||
        colKey === 'overall'
      ) {
        applyStatusCellFormatting(cell, cell.value);
        
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

  const reportSheet = workbook.addWorksheet('Report');
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

  if (logoImageId) {
    reportSheet.addImage(logoImageId, {
      tl: { col: 0.1, row: 0.8 },
      ext: { width: 80, height: 80 }
    });
  }

  const titleCell = reportSheet.getCell('C2');
  titleCell.value = `${(projectName || 'TestNexus').toUpperCase()} - EXECUTIVE EXECUTION DASHBOARD`;
  titleCell.font = { bold: true, size: 16, color: { argb: headerBgColor === 'FFFFFFFF' ? 'FF1E293B' : headerBgColor } };

  const subtitleCell = reportSheet.getCell('C3');
  subtitleCell.value = `Generated: ${new Date().toLocaleString()} | Total Test Cases: ${testCases.length}`;
  subtitleCell.font = { italic: true, size: 10, color: { argb: 'FF64748B' } };

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

  const modules = new Set();
  testCases.forEach(tc => { modules.add(tc.module || 'General'); });
  const moduleList = Array.from(modules);

  let startRow = 6;
  const overCol = lastColLetter;
  moduleList.forEach((mod, idx) => {
    const rowNum = startRow + idx;
    const row = reportSheet.getRow(rowNum);
    row.height = 22;

    const epics = testCases.filter(c => (c.module || 'General') === mod);
    const journeysCount = epics.length;
    const noRunsCount = epics.filter(c => c.status === 'PENDING').length;
    const executedCount = epics.filter(c => c.status !== 'PENDING').length;
    const passedCount = epics.filter(c => c.status === 'PASS').length;
    const inProgressCount = epics.filter(c => c.status === 'IN PROGRESS').length;
    const failedCount = epics.filter(c => c.status === 'FAIL' || c.status === 'BLOCKED').length;
    const execRate = journeysCount > 0 ? (executedCount / journeysCount) : 0;
    const passRate = journeysCount > 0 ? (passedCount / journeysCount) : 0;
    
    row.getCell(1).value = mod;
    row.getCell(2).value = { formula: `COUNTIF('Execution Tracker'!$E:$E, A${rowNum})`, result: journeysCount };
    row.getCell(3).value = { formula: `COUNTIFS('Execution Tracker'!$E:$E, A${rowNum}, 'Execution Tracker'!$${overCol}:$${overCol}, "PENDING")`, result: noRunsCount };
    row.getCell(4).value = { formula: `COUNTIFS('Execution Tracker'!$E:$E, A${rowNum}, 'Execution Tracker'!$${overCol}:$${overCol}, "<>PENDING")`, result: executedCount };
    row.getCell(5).value = { formula: `COUNTIFS('Execution Tracker'!$E:$E, A${rowNum}, 'Execution Tracker'!$${overCol}:$${overCol}, "PASS")`, result: passedCount };
    row.getCell(6).value = { formula: `COUNTIFS('Execution Tracker'!$E:$E, A${rowNum}, 'Execution Tracker'!$${overCol}:$${overCol}, "IN PROGRESS")`, result: inProgressCount };
    row.getCell(7).value = { formula: `COUNTIFS('Execution Tracker'!$E:$E, A${rowNum}, 'Execution Tracker'!$${overCol}:$${overCol}, "FAIL") + COUNTIFS('Execution Tracker'!$E:$E, A${rowNum}, 'Execution Tracker'!$${overCol}:$${overCol}, "BLOCKED")`, result: failedCount };
    row.getCell(8).value = { formula: `IF(B${rowNum}>0, D${rowNum}/B${rowNum}, 0)`, result: execRate };
    row.getCell(9).value = { formula: `IF(B${rowNum}>0, E${rowNum}/B${rowNum}, 0)`, result: passRate };
    
    row.getCell(8).numFmt = '0%';
    row.getCell(9).numFmt = '0%';
    
    for (let c = 1; c <= 13; c++) {
      const cell = row.getCell(c);
      cell.border = thinBorder;
      cell.alignment = { vertical: 'middle', horizontal: c === 1 ? 'left' : (c > 9 ? 'left' : 'center') };
      cell.font = { size: 10 };
    }
  });

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
  tRow.getCell(8).value = { formula: `IF(B${totalRowNum}>0, D${totalRowNum}/B${totalRowNum}, 0)`, result: totalExecRate };
  tRow.getCell(9).value = { formula: `IF(B${totalRowNum}>0, E${totalRowNum}/B${totalRowNum}, 0)`, result: totalPassRate };
  
  tRow.getCell(8).numFmt = '0%';
  tRow.getCell(9).numFmt = '0%';
  
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

  // 2. BURNDOWN CHART TAB
  addBurndownSheet({ workbook, testCases, project, headerBgColor, headerFontColor });

  const safeName = (projectName || 'Test_Nexus').replace(/[^a-z0-9]/gi, '_');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${safeName}_Execution_Tracker.xlsx"`);

  await workbook.xlsx.write(res);
  res.end();
};

module.exports = {
  exportTestCases
};
