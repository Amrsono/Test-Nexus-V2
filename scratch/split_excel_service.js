const fs = require('fs');
const path = require('path');

// Ensure directory
const excelDir = path.join(__dirname, '../server/services/excel');
if (!fs.existsSync(excelDir)) {
  fs.mkdirSync(excelDir, { recursive: true });
}

// 1. excelStyles.js
const excelStyles = `const getThemeColorArgb = (project) => {
  if (project && project.themeColor) {
    const hex = project.themeColor.replace('#', '');
    if (hex.length === 6) return \`FF\${hex.toUpperCase()}\`;
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
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
    cell.font = { color: { argb: 'FF166534' }, bold: true, size: 9 };
  } else if (valUpper === 'FAIL') {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
    cell.font = { color: { argb: 'FF991B1B' }, bold: true, size: 9 };
  } else if (valUpper === 'BLOCKED') {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
    cell.font = { color: { argb: 'FF92400E' }, bold: true, size: 9 };
  } else if (valUpper === 'IN PROGRESS') {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
    cell.font = { color: { argb: 'FF1E40AF' }, bold: true, size: 9 };
  } else if (valUpper === 'PENDING') {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    cell.font = { color: { argb: 'FF475569' }, bold: true, size: 9 };
  } else if (valUpper === 'N/A') {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    cell.font = { color: { argb: 'FF94A3B8' }, italic: true, size: 9 };
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

module.exports = {
  getThemeColorArgb,
  isColorDark,
  getColumnLetter,
  thinBorder,
  applyStatusCellFormatting,
  getCellValue,
  getValByHeader
};
`;

fs.writeFileSync(path.join(excelDir, 'excelStyles.js'), excelStyles);

// 2. Read existing service to extract export and sync logic cleanly
const fullService = fs.readFileSync(path.join(__dirname, '../server/services/testCaseExcelService.js'), 'utf8');

// Extract exportTestCases function
const exportStart = fullService.indexOf('const exportTestCases = async');
const syncStart = fullService.indexOf('const syncTestCases = async');
const exportFnCode = fullService.substring(exportStart, syncStart).trim();
const syncFnCode = fullService.substring(syncStart, fullService.indexOf('module.exports = {')).trim();

const excelExport = \`const prisma = require('../../lib/prisma');
const ExcelJS = require('exceljs');
const {
  getThemeColorArgb,
  isColorDark,
  getColumnLetter,
  thinBorder,
  applyStatusCellFormatting
} = require('./excelStyles');

\${exportFnCode}

module.exports = {
  exportTestCases
};
\`;

fs.writeFileSync(path.join(excelDir, 'excelExport.js'), excelExport);

const excelSync = \`const prisma = require('../../lib/prisma');
const ExcelJS = require('exceljs');
const logger = require('../../lib/logger');
const {
  getCellValue,
  getValByHeader
} = require('./excelStyles');

\${syncFnCode}

module.exports = {
  syncTestCases
};
\`;

fs.writeFileSync(path.join(excelDir, 'excelSync.js'), excelSync);

// Replace testCaseExcelService with clean re-export
const facade = \`const { exportTestCases } = require('./excel/excelExport');
const { syncTestCases } = require('./excel/excelSync');

module.exports = {
  exportTestCases,
  syncTestCases
};
\`;

fs.writeFileSync(path.join(__dirname, '../server/services/testCaseExcelService.js'), facade);
console.log('Successfully modularized testCaseExcelService');
