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
    const statuses = ['PENDING', 'IN PROGRESS', 'PASS', 'FAIL', 'BLOCKED'];
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
          formulae: ['_SystemLists!$A$1:$A$5'],
          showErrorMessage: true,
          errorTitle: 'Invalid Status',
          error: 'Please select a valid status from the list.'
        };
      });
    });

    // Final Styling (Borders & Auto-filter)
    const lastColLetter = getColumnLetter(finalColumns.length);
    sheet.autoFilter = `A1:${lastColLetter}1`;
    
    // === Add Report Worksheet ===
    const reportSheet = workbook.addWorksheet('Report');
    
    // Extract unique modules
    const modules = new Set();
    scenarios.forEach(s => {
      modules.add(s.module || 'Draft');
    });
    const moduleList = Array.from(modules);

    // Columns for Report
    reportSheet.columns = [
      { header: 'Epic', key: 'epic', width: 35 },
      { header: 'Journeys', key: 'journeys', width: 10 },
      { header: 'no runs', key: 'no_runs', width: 10 },
      { header: 'Executed', key: 'executed', width: 10 },
      { header: 'completed/Passed', key: 'passed', width: 18 },
      { header: 'in progress', key: 'in_progress', width: 12 },
      { header: 'Blocked/failed', key: 'failed', width: 15 },
      { header: 'Execution rate', key: 'exec_rate', width: 15 },
      { header: 'pass rate', key: 'pass_rate', width: 12 },
      { header: 'Data required', key: 'data_req', width: 15 },
      { header: 'Depending on', key: 'depending', width: 15 },
      { header: 'Fix Date', key: 'fix_date', width: 12 },
      { header: 'Manual intervention', key: 'manual', width: 20 }
    ];

    // Style Report Header Row
    const repHeader = reportSheet.getRow(1);
    repHeader.font = { bold: true };
    repHeader.alignment = { horizontal: 'center' };
    
    // Add data rows with formulas
    // executionTracker col D is Module
    // executionTracker overallCol is the overall journey status column letter
    const overCol = lastColLetter;
    let startRow = 2;
    moduleList.forEach((mod, idx) => {
      const rowNum = startRow + idx;
      const row = reportSheet.addRow({
        epic: mod,
        journeys: { formula: `COUNTIF('Execution Tracker'!$D:$D, A${rowNum})` },
        no_runs: { formula: `COUNTIFS('Execution Tracker'!$D:$D, A${rowNum}, 'Execution Tracker'!$${overCol}:$${overCol}, "PENDING")` },
        executed: { formula: `COUNTIFS('Execution Tracker'!$D:$D, A${rowNum}, 'Execution Tracker'!$${overCol}:$${overCol}, "<>PENDING")` },
        passed: { formula: `COUNTIFS('Execution Tracker'!$D:$D, A${rowNum}, 'Execution Tracker'!$${overCol}:$${overCol}, "PASS")` },
        in_progress: { formula: `COUNTIFS('Execution Tracker'!$D:$D, A${rowNum}, 'Execution Tracker'!$${overCol}:$${overCol}, "IN PROGRESS")` },
        failed: { formula: `COUNTIFS('Execution Tracker'!$D:$D, A${rowNum}, 'Execution Tracker'!$${overCol}:$${overCol}, "FAIL") + COUNTIFS('Execution Tracker'!$D:$D, A${rowNum}, 'Execution Tracker'!$${overCol}:$${overCol}, "BLOCKED")` },
        exec_rate: { formula: `IF(B${rowNum}>0, D${rowNum}/B${rowNum}, 0)` },
        pass_rate: { formula: `IF(B${rowNum}>0, E${rowNum}/B${rowNum}, 0)` }
      });
      row.getCell('exec_rate').numFmt = '0%';
      row.getCell('pass_rate').numFmt = '0%';
    });

    // Add Total Row
    const totalRow = startRow + moduleList.length;
    const tRow = reportSheet.addRow({
      epic: 'Total',
      journeys: { formula: `SUM(B2:B${totalRow-1})` },
      no_runs: { formula: `SUM(C2:C${totalRow-1})` },
      executed: { formula: `SUM(D2:D${totalRow-1})` },
      passed: { formula: `SUM(E2:E${totalRow-1})` },
      in_progress: { formula: `SUM(F2:F${totalRow-1})` },
      failed: { formula: `SUM(G2:G${totalRow-1})` },
      exec_rate: { formula: `IF(B${totalRow}>0, D${totalRow}/B${totalRow}, 0)` },
      pass_rate: { formula: `IF(B${totalRow}>0, E${totalRow}/B${totalRow}, 0)` }
    });
    tRow.getCell('exec_rate').numFmt = '0%';
    tRow.getCell('pass_rate').numFmt = '0%';
    tRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    tRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF000000' } };


    // === Add Burndown Chart Worksheet ===
    const bdSheet = workbook.addWorksheet('Burndown Chart');
    
    bdSheet.columns = [
      { header: 'Epic', key: 'epic', width: 35 },
      { header: 'CJT release', key: 'release', width: 15 },
      { header: 'Duration', key: 'duration', width: 15 },
      { header: 'Journeys', key: 'journeys', width: 10 },
      { header: 'Week 1', key: 'w1', width: 10 },
      { header: 'Week 2', key: 'w2', width: 10 },
      { header: 'Week 3', key: 'w3', width: 10 },
      { header: 'Week 4', key: 'w4', width: 10 },
      { header: 'Week 5', key: 'w5', width: 10 },
      { header: 'Week 6', key: 'w6', width: 10 },
      { header: 'Week 7', key: 'w7', width: 10 },
      { header: 'Week 8', key: 'w8', width: 10 }
    ];

    const bdHeader = bdSheet.getRow(1);
    bdHeader.font = { bold: true };
    bdHeader.alignment = { horizontal: 'center' };

    moduleList.forEach((mod, idx) => {
      const rowNum = 2 + idx;
      bdSheet.addRow({
        epic: mod,
        journeys: { formula: `COUNTIF('Execution Tracker'!$D:$D, A${rowNum})` }
      });
    });

    const bdTotalRow = 2 + moduleList.length;
    const bdTRow = bdSheet.addRow({
      epic: 'Total',
      journeys: { formula: `SUM(D2:D${bdTotalRow-1})` }
    });
    bdTRow.font = { bold: true };
    
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
