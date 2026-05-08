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

    // Configure Columns
    sheet.columns = [
      { header: '#', key: 'idx', width: 5 },
      { header: 'Journey Summary', key: 'summary', width: 45 },
      { header: 'Execution Priority', key: 'priority', width: 15 },
      { header: 'Module', key: 'module', width: 20 },
      { header: 'Test Steps', key: 'steps', width: 60 },
      { header: 'Expected Outcome', key: 'expectedResult', width: 50 },
      { header: 'Validation: Order Build', key: 'orderBuild', width: 30 },
      { header: 'Build Status', key: 'obStatus', width: 15 },
      { header: 'Validation: Status Sync', key: 'orderCompletion', width: 30 },
      { header: 'Sync Status', key: 'ocStatus', width: 15 },
      { header: 'Validation: T&C / Comms', key: 'tcAssurance', width: 30 },
      { header: 'Comms Status', key: 'tcStatus', width: 15 },
      { header: 'Validation: Billing', key: 'billing', width: 30 },
      { header: 'Billing Status', key: 'bStatus', width: 15 },
      { header: 'OVERALL JOURNEY STATUS', key: 'overall', width: 25 }
    ];

    // Style Header Row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 30;

    // Add Data & Validations
    scenarios.forEach((s, i) => {
      const row = sheet.addRow({
        idx: i + 1,
        summary: s.summary || '',
        priority: s.priority || 'MEDIUM',
        module: s.module || 'Draft',
        steps: s.steps || '',
        expectedResult: s.expectedResult || '',
        orderBuild: s.orderBuild || 'N/A',
        obStatus: 'PENDING',
        orderCompletion: s.orderCompletion || 'N/A',
        ocStatus: 'PENDING',
        tcAssurance: s.tcAssurance || 'N/A',
        tcStatus: 'PENDING',
        billing: s.billing || 'N/A',
        bStatus: 'PENDING',
        overall: 'PENDING'
      });

      // Style row
      row.alignment = { vertical: 'middle', wrapText: true };
      
      // Add Dropdowns to Status columns (Using Referenced Formula)
      ['H', 'J', 'L', 'N', 'O'].forEach(col => {
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
    sheet.autoFilter = 'A1:O1';
    
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
