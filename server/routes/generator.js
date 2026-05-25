const express = require('express');
const router = express.Router();
const { generateScenarios } = require('../services/aiGenerator');
const { emitStatus } = require('../socket');
const ExcelJS = require('exceljs');

// POST /api/generator/generate
router.post('/generate', async (req, res) => {
  const { requirements, options } = req.body;
  if (!requirements) return res.status(400).json({ error: 'Requirements are required' });

  try {
    const scenarios = await generateScenarios(requirements, (msg) => {
      emitStatus(msg);
    }, options);
    res.json(scenarios);
  } catch (error) {
    console.error('Generation Route Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/generator/export - Now with Interactive Dropdowns
router.post('/export', async (req, res) => {
  const { scenarios, projectName } = req.body;
  if (!scenarios || !Array.isArray(scenarios)) {
    return res.status(400).json({ error: 'Scenarios array is required' });
  }

  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Execution Tracker');

    // Create a hidden sheet for the dropdown values (More robust than literal strings)
    const listSheet = workbook.addWorksheet('_SystemLists', { state: 'hidden' });
    const statuses = ['PENDING', 'PASS', 'FAIL', 'BLOCKED'];
    statuses.forEach((s, idx) => {
      listSheet.getCell(`A${idx + 1}`).value = s;
    });

    // Helper to get normalized validation points for a scenario
    const getValidationPoints = (s) => {
      if (s.validationPoints && Array.isArray(s.validationPoints)) {
        return s.validationPoints;
      }
      // Migrate old format on the fly
      const points = [];
      if (s.orderBuild) points.push({ name: 'Order Build', value: s.orderBuild });
      if (s.orderCompletion) points.push({ name: 'Status Sync', value: s.orderCompletion });
      if (s.tcAssurance) points.push({ name: 'T&C / Comms', value: s.tcAssurance });
      if (s.billing) points.push({ name: 'Billing', value: s.billing });
      return points;
    };

    // Gather all unique validation point names across all scenarios
    const validationPointNames = new Set();
    scenarios.forEach(s => {
      getValidationPoints(s).forEach(vp => {
        if (vp.name) validationPointNames.add(vp.name);
      });
    });
    const vpNamesList = Array.from(validationPointNames);

    // Configure Columns
    const baseColumns = [
      { header: '#', key: 'idx', width: 5 },
      { header: 'Journey Summary', key: 'summary', width: 45 },
      { header: 'Execution Priority', key: 'priority', width: 15 },
      { header: 'Module', key: 'module', width: 20 },
      { header: 'Test Steps', key: 'steps', width: 60 },
      { header: 'Expected Outcome', key: 'expectedResult', width: 50 }
    ];

    const vpColumns = vpNamesList.flatMap((name, idx) => [
      { header: `Validation: ${name}`, key: `vp_${idx}`, width: 30 },
      { header: `${name} Status`, key: `vpStatus_${idx}`, width: 15 }
    ]);

    const finalColumns = [
      ...baseColumns,
      ...vpColumns,
      { header: 'OVERALL JOURNEY STATUS', key: 'overall', width: 25 }
    ];

    sheet.columns = finalColumns;

    // Style Header Row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 30;

    // Determine the Excel Column letters for data validation (Status columns)
    const getColumnLetter = (colIndex) => {
      let temp, letter = '';
      while (colIndex > 0) {
        temp = (colIndex - 1) % 26;
        letter = String.fromCharCode(temp + 65) + letter;
        colIndex = (colIndex - temp - 1) / 26;
      }
      return letter;
    };

    const statusColIndices = vpNamesList.map((_, idx) => baseColumns.length + idx * 2 + 2);
    statusColIndices.push(finalColumns.length); // OVERALL JOURNEY STATUS

    const statusColLetters = statusColIndices.map(getColumnLetter);

    // Add Data & Validations
    scenarios.forEach((s, i) => {
      const vps = getValidationPoints(s);
      
      const rowData = {
        idx: i + 1,
        summary: s.summary || '',
        priority: s.priority || 'MEDIUM',
        module: s.module || 'Draft',
        steps: s.steps || '',
        expectedResult: s.expectedResult || ''
      };

      vpNamesList.forEach((name, idx) => {
        const vp = vps.find(v => v.name === name);
        rowData[`vp_${idx}`] = vp ? vp.value : 'N/A';
        rowData[`vpStatus_${idx}`] = 'PENDING';
      });

      rowData.overall = 'PENDING';

      const row = sheet.addRow(rowData);

      // Style row
      row.alignment = { vertical: 'middle', wrapText: true };
      
      // Add Dropdowns to Status columns (Using Referenced Formula)
      statusColLetters.forEach(col => {
        sheet.getCell(`${col}${i + 2}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: ['_SystemLists!$A$1:$A$4'],
          showErrorMessage: true,
          errorTitle: 'Invalid Status',
          error: 'Please select a valid status from the list.'
        };
      });
    });

    // Final Styling (Borders & Auto-filter)
    const lastColLetter = getColumnLetter(finalColumns.length);
    sheet.autoFilter = `A1:${lastColLetter}1`;
    
    const safeName = (projectName || 'Test_Plan').replace(/[^a-z0-9]/gi, '_');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}_Execution_Tracker.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export Route Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
