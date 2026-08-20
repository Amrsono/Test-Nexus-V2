const prisma = require('../lib/prisma');
const ExcelJS = require('exceljs');

const getThemeColorArgb = (project) => {
  if (project && project.themeColor) {
    const hex = project.themeColor.replace('#', '');
    if (hex.length === 6) return `FF${hex.toUpperCase()}`;
  }
  return 'FF1E293B'; // Default slate header
};

const isColorDark = (hexColor) => {
  if (!hexColor) return true;
  const hex = hexColor.replace('#', '');
  if (hex.length !== 6) return true;
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 128;
};

const getColumnLetter = (colIndex) => {
  let temp, letter = '';
  while (colIndex > 0) {
    temp = (colIndex - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    colIndex = (colIndex - temp - 1) / 26;
  }
  return letter;
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

const getCellValue = (cell) => {
  if (!cell) return '';
  if (cell.value && typeof cell.value === 'object') {
    if (cell.value.result !== undefined) return String(cell.value.result).trim();
    if (cell.value.text !== undefined) return String(cell.value.text).trim();
    return String(cell.value).trim();
  }
  return cell.value ? String(cell.value).trim() : '';
};

const getValByHeader = (row, headerName, headers) => {
  const idx = headers.indexOf(headerName);
  if (idx === -1) return '';
  return getCellValue(row.getCell(idx));
};

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

  const bdSheet = workbook.addWorksheet('Burndown Chart');
  const bdCols = [
    { width: 10 },
    { width: 22 },
    { width: 16 },
    { width: 18 },
    { width: 20 },
    { width: 18 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
  ];
  bdCols.forEach((col, idx) => {
    bdSheet.getColumn(idx + 1).width = col.width;
  });

  const bdHeaderRow = bdSheet.getRow(1);
  bdHeaderRow.height = 32;
  bdHeaderLabels.forEach((label, idx) => {
    const cell = bdHeaderRow.getCell(idx + 1);
    cell.value = label;
    cell.font = { bold: true, color: { argb: headerFontColor }, size: 10 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerBgColor } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });

  const totalJourneysAll = testCases.length;
  const now = new Date();
  let bdStartDate = project && project.startDate ? new Date(project.startDate) : null;
  let bdEndDate   = project && project.goLiveDate ? new Date(project.goLiveDate) : null;

  let numWeeks = 8;
  if (bdStartDate && bdEndDate) {
    const diffMs = bdEndDate.getTime() - bdStartDate.getTime();
    numWeeks = Math.max(1, Math.min(16, Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000))));
  }

  const fmtDate = (d) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

  let dataRowIndex = 2;
  for (let w = 1; w <= numWeeks; w++) {
    const row = bdSheet.getRow(dataRowIndex);
    row.height = 22;

    let weekStart, weekEnd;
    if (bdStartDate) {
      weekStart = new Date(bdStartDate.getTime() + (w - 1) * 7 * 24 * 60 * 60 * 1000);
      weekEnd   = new Date(bdStartDate.getTime() + w       * 7 * 24 * 60 * 60 * 1000);
    }

    const idealRemaining = Math.max(0, Math.round(totalJourneysAll * (1 - w / numWeeks)));
    const weekIsPast = weekEnd && weekEnd <= now;
    let executed = null, remaining = null, blocked = null, passed = null, failed = null;

    if (weekIsPast && bdStartDate) {
      executed  = testCases.filter(c => c.status !== 'PENDING' && new Date(c.updatedAt) <= weekEnd).length;
      blocked   = testCases.filter(c => c.status === 'BLOCKED'  && new Date(c.updatedAt) <= weekEnd).length;
      passed    = testCases.filter(c => c.status === 'PASS'     && new Date(c.updatedAt) <= weekEnd).length;
      failed    = testCases.filter(c => c.status === 'FAIL'     && new Date(c.updatedAt) <= weekEnd).length;
      remaining = Math.max(0, totalJourneysAll - executed);
    }

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

    for (let c = 1; c <= 9; c++) {
      const cell = row.getCell(c);
      cell.border = thinBorder;
      cell.alignment = { vertical: 'middle', horizontal: c <= 2 ? 'left' : 'center' };
      cell.font = { size: 10 };
      if (c >= 3) cell.numFmt = '#,##0';
    }

    const isCurrentWeek = weekStart && weekEnd && weekStart <= now && now < weekEnd;
    if (isCurrentWeek) {
      for (let c = 1; c <= 9; c++) {
        row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF9C4' } };
      }
    }

    if (remaining !== null) {
      const remCell = row.getCell(6);
      if (remaining <= idealRemaining) {
        remCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
        remCell.font = { size: 10, bold: true, color: { argb: 'FF065F46' } };
      } else {
        remCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
        remCell.font = { size: 10, bold: true, color: { argb: 'FF991B1B' } };
      }
    }

    dataRowIndex++;
  }

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
  bdSumRow.getCell(4).value = '—';
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

  const safeName = (projectName || 'Test_Nexus').replace(/[^a-z0-9]/gi, '_');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${safeName}_Execution_Tracker.xlsx"`);

  await workbook.xlsx.write(res);
  res.end();
};

const syncTestCases = async ({ projectId, file, userId, userRole }) => {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error('Project not found');
  if (project.ownerId !== userId && userRole !== 'ADMIN') {
    throw new Error('You do not own this project');
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(file.buffer);
  const sheet = workbook.getWorksheet('Execution Tracker');
  if (!sheet) {
    throw new Error('Invalid file format: "Execution Tracker" sheet not found.');
  }

  const headers = [];
  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell, colNumber) => {
    headers[colNumber] = cell.value ? String(cell.value).trim() : '';
  });

  const existingTestCases = await prisma.testCase.findMany({
    where: { suite: { projectId } }
  });
  const existingIds = new Set(existingTestCases.map(tc => tc.id));

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
    const summary = getValByHeader(row, 'Journey Summary', headers);

    if (!id && !summary) return;

    const priority = getValByHeader(row, 'Execution Priority', headers);
    const module = getValByHeader(row, 'Module', headers);
    const steps = getValByHeader(row, 'Test Steps', headers);
    const expectedResult = getValByHeader(row, 'Expected Outcome', headers);
    const checkUi = String(getValByHeader(row, 'UI Valid Status', headers)).toUpperCase().trim() === 'PASS';
    const orderBuild = getValByHeader(row, 'Order Build Detail', headers);
    const checkOrderBuild = String(getValByHeader(row, 'Order Build Status', headers)).toUpperCase().trim() === 'PASS';
    const orderCompletion = getValByHeader(row, 'Completion Detail', headers);
    const checkOrderCompletion = String(getValByHeader(row, 'Completion Status', headers)).toUpperCase().trim() === 'PASS';
    const tcAssurance = getValByHeader(row, 'T&C / Comms Detail', headers);
    const checkPcsMcpr = String(getValByHeader(row, 'T&C / Comms Status', headers)).toUpperCase().trim() === 'PASS';
    const billing = getValByHeader(row, 'Billing Detail', headers);
    const checkBilling = String(getValByHeader(row, 'Billing Status', headers)).toUpperCase().trim() === 'PASS';
    let status = String(getValByHeader(row, 'OVERALL JOURNEY STATUS', headers)).toUpperCase().trim() || 'PENDING';
    if (!['PENDING', 'IN PROGRESS', 'PASS', 'FAIL', 'BLOCKED'].includes(status)) {
      status = 'PENDING';
    }

    const customValidations = [];
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
        const label = h.substring(0, h.length - 7);
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
  return { success: true, count: updatedCases.length, testCases: updatedCases };
};

module.exports = {
  exportTestCases,
  syncTestCases
};
