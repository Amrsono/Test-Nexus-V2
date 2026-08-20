const { thinBorder } = require('./excelStyles');

const addBurndownSheet = ({ workbook, testCases, project, headerBgColor, headerFontColor }) => {
  const bdHeaderLabels = [
    'Week #', 'Date Range', 'Total Cases', 'Ideal Remaining',
    'Actual Executed', 'Actual Remaining', 'Blocked', 'Passed', 'Failed'
  ];

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

};

module.exports = {
  addBurndownSheet
};
