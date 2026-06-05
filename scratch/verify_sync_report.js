const { PrismaClient } = require('@prisma/client');
const ExcelJS = require('exceljs');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Sync & Create Excel Verification ---');
  let testProject = null;
  let testSuite = null;
  let preExistingCase = null;

  try {
    // 1. Setup mock data in DB
    console.log('1. Setting up test project, suite, and pre-existing case...');
    testProject = await prisma.project.create({
      data: { name: 'Excel Sync Verification Project' }
    });

    testSuite = await prisma.testSuite.create({
      data: {
        name: 'Verification Suite',
        projectId: testProject.id
      }
    });

    preExistingCase = await prisma.testCase.create({
      data: {
        summary: 'Original Journey Summary',
        steps: 'Step 1: Login',
        expectedResult: 'Logged in successfully',
        priority: 'HIGH',
        module: 'Auth',
        status: 'PENDING',
        suiteId: testSuite.id
      }
    });

    console.log(`   Pre-existing case created with ID: ${preExistingCase.id}`);

    // 2. Build mock Excel sheet
    console.log('2. Building mock Excel workbook in-memory...');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Execution Tracker');

    const headers = [
      'Case ID', '#', 'Journey Summary', 'Execution Priority', 'Module',
      'Test Steps', 'Expected Outcome', 'UI Valid Status', 'Order Build Detail',
      'Order Build Status', 'Completion Detail', 'Completion Status',
      'T&C / Comms Detail', 'T&C / Comms Status', 'Billing Detail', 'Billing Status',
      'OVERALL JOURNEY STATUS'
    ];

    sheet.addRow(headers);

    // Row 2: Modify preExistingCase
    sheet.addRow([
      preExistingCase.id,               // Case ID
      1,                                // #
      'Modified Journey Summary',        // Journey Summary
      'HIGH',                           // Execution Priority
      'Auth',                           // Module
      'Step 1: Login',                  // Test Steps
      'Logged in successfully',         // Expected Outcome
      'PASS',                           // UI Valid Status (should map checkUi=true)
      'N/A',                            // Order Build Detail
      'PENDING',                        // Order Build Status
      'N/A',                            // Completion Detail
      'PENDING',                        // Completion Status
      'N/A',                            // T&C / Comms Detail
      'PENDING',                        // T&C / Comms Status
      'N/A',                            // Billing Detail
      'PENDING',                        // Billing Status
      'PASS'                            // OVERALL JOURNEY STATUS
    ]);

    // Row 3: Create a new test case
    sheet.addRow([
      '',                               // Case ID (empty for new case)
      2,                                // #
      'Created via Sync Test',          // Journey Summary
      'MEDIUM',                         // Execution Priority
      'Dashboard',                      // Module
      'Step 1: Open Dashboard',         // Test Steps
      'Dashboard displayed',            // Expected Outcome
      'PENDING',                        // UI Valid Status
      'N/A',                            // Order Build Detail
      'PENDING',                        // Order Build Status
      'N/A',                            // Completion Detail
      'PENDING',                        // Completion Status
      'N/A',                            // T&C / Comms Detail
      'PENDING',                        // T&C / Comms Status
      'N/A',                            // Billing Detail
      'PENDING',                        // Billing Status
      'IN PROGRESS'                     // OVERALL JOURNEY STATUS
    ]);

    const buffer = await workbook.xlsx.writeBuffer();
    console.log(`   Mock Excel file generated. Size: ${buffer.length} bytes.`);

    // 3. Run the exact sync logic we implemented
    console.log('3. Running the sync logic on the mock buffer...');
    const resultWorkbook = new ExcelJS.Workbook();
    await resultWorkbook.xlsx.load(buffer);
    const syncSheet = resultWorkbook.getWorksheet('Execution Tracker');

    const sheetHeaders = [];
    const headerRow = syncSheet.getRow(1);
    headerRow.eachCell((cell, colNumber) => {
      sheetHeaders[colNumber] = cell.value ? String(cell.value).trim() : '';
    });

    const getCellValue = (cell) => {
      if (!cell) return '';
      if (cell.value && typeof cell.value === 'object') {
        if (cell.value.result !== undefined) return String(cell.value.result).trim();
        if (cell.value.text !== undefined) return String(cell.value.text).trim();
        return String(cell.value).trim();
      }
      return cell.value ? String(cell.value).trim() : '';
    };

    const getValByHeader = (row, headerName) => {
      const idx = sheetHeaders.indexOf(headerName);
      if (idx === -1) return '';
      return getCellValue(row.getCell(idx));
    };

    // Load existing test cases
    const existingTestCases = await prisma.testCase.findMany({
      where: { suite: { projectId: testProject.id } }
    });
    const existingIds = new Set(existingTestCases.map(tc => tc.id));

    // Find or create default suite
    let defaultSuite = await prisma.testSuite.findFirst({
      where: { projectId: testProject.id }
    });
    if (!defaultSuite) {
      defaultSuite = await prisma.testSuite.create({
        data: {
          name: 'Excel Import Suite',
          projectId: testProject.id
        }
      });
    }
    const suiteId = defaultSuite.id;

    const updatedCases = [];
    const rowPromises = [];

    syncSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return; // skip header

      const id = getCellValue(row.getCell(1));
      const summary = getValByHeader(row, 'Journey Summary');

      if (!id && !summary) return;

      const priority = getValByHeader(row, 'Execution Priority');
      const module = getValByHeader(row, 'Module');
      const steps = getValByHeader(row, 'Test Steps');
      const expectedResult = getValByHeader(row, 'Expected Outcome');
      const checkUi = getValByHeader(row, 'UI Valid Status') === 'PASS';
      const orderBuild = getValByHeader(row, 'Order Build Detail');
      const checkOrderBuild = getValByHeader(row, 'Order Build Status') === 'PASS';
      const orderCompletion = getValByHeader(row, 'Completion Detail');
      const checkOrderCompletion = getValByHeader(row, 'Completion Status') === 'PASS';
      const tcAssurance = getValByHeader(row, 'T&C / Comms Detail');
      const checkPcsMcpr = getValByHeader(row, 'T&C / Comms Status') === 'PASS';
      const billing = getValByHeader(row, 'Billing Detail');
      const checkBilling = getValByHeader(row, 'Billing Status') === 'PASS';
      const status = getValByHeader(row, 'OVERALL JOURNEY STATUS') || 'PENDING';

      const customValidations = [];
      if (billing && billing !== 'N/A') {
        customValidations.push({
          id: 'billing_check',
          label: 'Billing Check',
          value: billing,
          checked: checkBilling
        });
      }

      sheetHeaders.forEach((h, idx) => {
        if (h && h.endsWith(' Detail') && 
            h !== 'Order Build Detail' && 
            h !== 'Completion Detail' && 
            h !== 'T&C / Comms Detail' && 
            h !== 'Billing Detail'
        ) {
          const label = h.substring(0, h.length - 7);
          const detailValue = getCellValue(row.getCell(idx));
          const statusHeader = `${label} Status`;
          const statusIdx = sheetHeaders.indexOf(statusHeader);
          let checked = false;
          if (statusIdx !== -1) {
            checked = getCellValue(row.getCell(statusIdx)) === 'PASS';
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
          })
        );
      }
    });

    await Promise.all(rowPromises);
    console.log(`   Sync completed. Processed ${updatedCases.length} items.`);

    // 4. Validate results in DB
    console.log('4. Validating modifications in the database...');
    const allCases = await prisma.testCase.findMany({
      where: { suite: { projectId: testProject.id } },
      orderBy: { createdAt: 'asc' }
    });

    if (allCases.length !== 2) {
      throw new Error(`Expected exactly 2 test cases in the database, found ${allCases.length}`);
    }

    const modifiedCase = allCases.find(c => c.id === preExistingCase.id);
    const newCase = allCases.find(c => c.id !== preExistingCase.id);

    // Assertions
    if (modifiedCase.summary !== 'Modified Journey Summary') {
      throw new Error(`Failed to update summary. Found: ${modifiedCase.summary}`);
    }
    if (modifiedCase.checkUi !== true) {
      throw new Error(`Failed to update UI verification checkbox. Found: ${modifiedCase.checkUi}`);
    }
    if (modifiedCase.status !== 'PASS') {
      throw new Error(`Failed to update overall status to PASS. Found: ${modifiedCase.status}`);
    }

    if (newCase.summary !== 'Created via Sync Test') {
      throw new Error(`Failed to create new case with summary. Found: ${newCase.summary}`);
    }
    if (newCase.status !== 'IN PROGRESS') {
      throw new Error(`Failed to set overall status for new case to IN PROGRESS. Found: ${newCase.status}`);
    }
    if (newCase.suiteId !== testSuite.id) {
      throw new Error(`New case assigned to wrong suite ID. Found: ${newCase.suiteId}`);
    }

    console.log('   All DB validations passed successfully! Pre-existing case updated, new case created.');

  } catch (error) {
    console.error('   Verification failed with error:', error);
    process.exitCode = 1;
  } finally {
    // 5. Cleanup
    console.log('5. Cleaning up verification database records...');
    try {
      if (testProject) {
        await prisma.testCase.deleteMany({
          where: { suite: { projectId: testProject.id } }
        });
        await prisma.testSuite.deleteMany({
          where: { projectId: testProject.id }
        });
        await prisma.project.delete({
          where: { id: testProject.id }
        });
        console.log('   Cleanup completed successfully.');
      }
    } catch (cleanupError) {
      console.error('   Cleanup failed:', cleanupError.message);
    }
    await prisma.$disconnect();
  }
}

main();
