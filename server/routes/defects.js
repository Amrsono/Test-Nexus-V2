const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { auth } = require('../middleware/auth');
const ExcelJS = require('exceljs');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.use(auth);

// Export defects to Excel
router.get('/export', async (req, res) => {
  const { projectId } = req.query;
  if (!projectId) return res.status(400).json({ error: 'projectId is required' });

  try {
    // Check project ownership
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'You do not own this project' });
    }

    const defects = await prisma.defect.findMany({
      where: { projectId },
      orderBy: { raisedAt: 'desc' }
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Defects');

    // Create a hidden sheet for dropdown lists
    const listSheet = workbook.addWorksheet('_DefectLists', { state: 'hidden' });
    const severities = ['P1', 'P2', 'P3', 'P4'];
    severities.forEach((sev, idx) => {
      listSheet.getCell(`A${idx + 1}`).value = sev;
    });
    const statuses = ['OPEN', 'FIXED', 'VERIFIED', 'CLOSED'];
    statuses.forEach((st, idx) => {
      listSheet.getCell(`B${idx + 1}`).value = st;
    });

    const headerBgColor = 'FFF43F5E'; // Soft rose color matching defect cards
    const headerFontColor = 'FFFFFFFF';
    const thinBorder = {
      top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
    };

    const columns = [
      { header: 'ID', key: 'id', width: 25 },
      { header: 'External ID', key: 'externalId', width: 15 },
      { header: 'Title', key: 'title', width: 40 },
      { header: 'Severity', key: 'severity', width: 12 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Owner', key: 'owner', width: 20 },
      { header: 'Action Plan', key: 'actionPlan', width: 35 },
      { header: 'FUT Impact', key: 'futImpact', width: 35 },
      { header: 'Description', key: 'description', width: 45 },
      { header: 'Blocked Cases', key: 'blockedCases', width: 30 },
      { header: 'Raised At', key: 'raisedAt', width: 18 }
    ];

    sheet.columns = columns;

    // Style Header Row
    const headerRow = sheet.getRow(1);
    headerRow.height = 30;
    for (let c = 1; c <= columns.length; c++) {
      const cell = headerRow.getCell(c);
      cell.font = { bold: true, color: { argb: headerFontColor }, size: 10 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerBgColor } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    }

    // Add defects
    defects.forEach((defect) => {
      const rowData = {
        id: defect.id,
        externalId: defect.externalId || '',
        title: defect.title || '',
        severity: defect.severity || 'P2',
        status: defect.status || 'OPEN',
        owner: defect.owner || '',
        actionPlan: defect.actionPlan || '',
        futImpact: defect.futImpact || '',
        description: defect.description || '',
        blockedCases: defect.blockedCases || '',
        raisedAt: defect.raisedAt ? defect.raisedAt.toISOString().split('T')[0] : ''
      };

      const row = sheet.addRow(rowData);
      row.height = 24;
      row.alignment = { vertical: 'middle' };

      // Borders
      for (let c = 1; c <= columns.length; c++) {
        const cell = row.getCell(c);
        cell.border = thinBorder;
        cell.font = { size: 10 };
      }

      // Add Dropdowns & Colorings
      const severityCell = row.getCell(4);
      const statusCell = row.getCell(5);

      severityCell.dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['_DefectLists!$A$1:$A$4'],
        showErrorMessage: true,
        errorTitle: 'Invalid Severity',
        error: 'Please select a valid severity (P1, P2, P3, P4).'
      };

      statusCell.dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['_DefectLists!$B$1:$B$4'],
        showErrorMessage: true,
        errorTitle: 'Invalid Status',
        error: 'Please select a valid status (OPEN, FIXED, VERIFIED, CLOSED).'
      };

      // Severity Color coding
      const sev = String(defect.severity).toUpperCase().trim();
      if (sev === 'P1') {
        severityCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE11D48' } }; // Rose-600
        severityCell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 9 };
      } else if (sev === 'P2') {
        severityCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFECDD3' } }; // Rose-100
        severityCell.font = { color: { argb: 'FF9F1239' }, bold: true, size: 9 };
      } else if (sev === 'P3') {
        severityCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } }; // Amber-100
        severityCell.font = { color: { argb: 'FF92400E' }, bold: true, size: 9 };
      } else if (sev === 'P4') {
        severityCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } }; // Blue-100
        severityCell.font = { color: { argb: 'FF1E40AF' }, bold: true, size: 9 };
      }

      // Status Color coding
      const st = String(defect.status).toUpperCase().trim();
      if (st === 'OPEN') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }; // Red-100
        statusCell.font = { color: { argb: 'FF991B1B' }, bold: true, size: 9 };
      } else if (st === 'FIXED') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } }; // Amber-100
        statusCell.font = { color: { argb: 'FF92400E' }, bold: true, size: 9 };
      } else if (st === 'VERIFIED') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } }; // Emerald-100
        statusCell.font = { color: { argb: 'FF166534' }, bold: true, size: 9 };
      } else if (st === 'CLOSED') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }; // Slate-100
        statusCell.font = { color: { argb: 'FF475569' }, bold: true, size: 9 };
      }
    });

    sheet.autoFilter = `A1:K1`;

    const safeName = (project.name || 'Test_Nexus').replace(/[^a-z0-9]/gi, '_');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}_Defects.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Defect Export Route Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Import and Sync defects from Excel
router.post('/import', upload.single('file'), async (req, res) => {
  const { projectId } = req.body;
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  if (!projectId) return res.status(400).json({ error: 'projectId is required' });

  try {
    // Check project ownership
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'You do not own this project' });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const sheet = workbook.getWorksheet('Defects');
    if (!sheet) {
      return res.status(400).json({ error: 'Invalid file format: "Defects" sheet not found.' });
    }

    const headers = [];
    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell, colNumber) => {
      headers[colNumber] = cell.value ? String(cell.value).trim().toLowerCase() : '';
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
      const idx = headers.indexOf(headerName.toLowerCase());
      if (idx === -1) return '';
      return getCellValue(row.getCell(idx));
    };

    let importedCount = 0;
    const rowPromises = [];

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // skip header

      const id = getValByHeader(row, 'id');
      const externalId = getValByHeader(row, 'external id');
      const title = getValByHeader(row, 'title');
      const severity = getValByHeader(row, 'severity') || 'P2';
      const status = getValByHeader(row, 'status') || 'OPEN';
      const owner = getValByHeader(row, 'owner');
      const actionPlan = getValByHeader(row, 'action plan');
      const futImpact = getValByHeader(row, 'fut impact');
      const description = getValByHeader(row, 'description');
      const blockedCases = getValByHeader(row, 'blocked cases');
      const raisedAtVal = getValByHeader(row, 'raised at');

      if (!title) return; // Need a title to create/update

      let raisedAt = new Date();
      if (raisedAtVal) {
        const parsedDate = new Date(raisedAtVal);
        if (!isNaN(parsedDate.getTime())) {
          raisedAt = parsedDate;
        }
      }

      const upsertPromise = (async () => {
        let existingDefect = null;

        // Try lookup by ID first
        if (id) {
          existingDefect = await prisma.defect.findFirst({
            where: { id, projectId }
          });
        }

        // Try lookup by external ID next
        if (!existingDefect && externalId) {
          existingDefect = await prisma.defect.findFirst({
            where: { externalId, projectId }
          });
        }

        const data = {
          externalId,
          title,
          severity,
          status,
          owner,
          actionPlan,
          futImpact,
          description,
          blockedCases,
          raisedAt
        };

        if (existingDefect) {
          await prisma.defect.update({
            where: { id: existingDefect.id },
            data
          });
        } else {
          await prisma.defect.create({
            data: {
              ...data,
              project: { connect: { id: projectId } }
            }
          });
        }
        importedCount++;
      })();

      rowPromises.push(upsertPromise);
    });

    await Promise.all(rowPromises);

    res.json({ success: true, count: importedCount });
  } catch (error) {
    console.error('Defect Sync/Import Error:', error);
    res.status(500).json({ error: error.message });
  }
});


// Get all defects for a project
router.get('/', async (req, res) => {
  const { projectId } = req.query;
  if (!projectId) return res.status(400).json({ error: 'projectId is required' });

  try {
    // Check project ownership
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'You do not own this project' });
    }

    const defects = await prisma.defect.findMany({
      where: { projectId },
      include: { relatedCase: true },
      orderBy: { raisedAt: 'desc' }
    });
    res.json(defects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new defect
router.post('/', async (req, res) => {
  const { 
    projectId, title, severity, description, status,
    externalId, owner, actionPlan, futImpact, blockedCases,
    relatedCaseId, raisedAt 
  } = req.body;

  try {
    // Check project ownership
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'You do not own this project' });
    }

    const defect = await prisma.defect.create({
      data: {
        title,
        severity,
        description,
        status: status || 'OPEN',
        externalId,
        owner,
        actionPlan,
        futImpact,
        blockedCases,
        raisedAt: raisedAt ? new Date(raisedAt) : new Date(),
        project: { connect: { id: projectId } },
        relatedCase: relatedCaseId ? { connect: { id: relatedCaseId } } : undefined
      }
    });
    res.json(defect);
  } catch (error) {
    console.error('Defect Creation Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update a defect
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { 
    title, severity, description, status,
    externalId, owner, actionPlan, futImpact, blockedCases,
    relatedCaseId, raisedAt 
  } = req.body;

  try {
    const defect = await prisma.defect.update({
      where: { id },
      data: {
        title,
        severity,
        description,
        status,
        externalId,
        owner,
        actionPlan,
        futImpact,
        blockedCases,
        raisedAt: raisedAt ? new Date(raisedAt) : undefined,
        relatedCase: relatedCaseId ? { connect: { id: relatedCaseId } } : { disconnect: true }
      }
    });
    res.json(defect);
  } catch (error) {
    console.error('Defect Update Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a defect
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.defect.delete({ where: { id } });
    res.json({ message: 'Defect deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
