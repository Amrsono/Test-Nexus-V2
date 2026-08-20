const prisma = require('../../lib/prisma');
const ExcelJS = require('exceljs');
const {
  getCellValue,
  getValByHeader
} = require('./excelStyles');

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
  syncTestCases
};
