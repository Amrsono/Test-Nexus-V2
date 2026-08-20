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

module.exports = {
  getThemeColorArgb,
  isColorDark,
  getColumnLetter,
  applyStatusCellFormatting,
  getCellValue,
  getValByHeader
};
