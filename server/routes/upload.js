const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const prisma = require('../lib/prisma');
const { parseTestCases } = require('../services/aiParser');

const upload = multer({ storage: multer.memoryStorage() });

const { auth } = require('../middleware/auth');
const { emitStatus } = require('../socket');

router.use(auth);

router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { suiteName } = req.body;
    // Sanitize projectId - FormData sends null/undefined as literal strings
    const rawProjectId = req.body.projectId;
    const providedProjectId = (!rawProjectId || rawProjectId === 'null' || rawProjectId === 'undefined') ? null : rawProjectId;

    emitStatus('System: Aggregating workbook tabs...');

    // Read all sheets
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    let allRawData = [];
    
    workbook.SheetNames.forEach(name => {
      const sheet = workbook.Sheets[name];
      const data = xlsx.utils.sheet_to_json(sheet);
      // Add sheet name reference to each row
      const sheetData = data.map(row => ({ ...row, _sheetName: name }));
      allRawData = [...allRawData, ...sheetData];
    });

    // Extract unique headers across all sheets for cleaner AI mapping/manual backup
    const headers = [...new Set(allRawData.flatMap(row => Object.keys(row)))];
    emitStatus(`System: Analyzing ${headers.length} workbook columns...`);

    let fieldMapping = req.body.manualMapping ? JSON.parse(req.body.manualMapping) : null;
    let aiProject = null;

    if (!fieldMapping) {
      try {
        const aiResult = await parseTestCases(allRawData, headers, emitStatus, req.file.originalname);
        fieldMapping = aiResult.fieldMapping;
        aiProject = aiResult.project;
      } catch (aiError) {
        console.warn('AI Parsing failed, falling back to manual mapping:', aiError.message);
        return res.status(202).json({
          status: 'MAPPING_REQUIRED',
          headers: headers,
          filename: req.file.originalname,
          message: 'AI agent quota exhausted or analysis failed. Manual mapping required.'
        });
      }
    }

    // Dynamic header discovery for validation columns
    const findHeader = (patterns) => {
      return headers.find(h => patterns.some(p => h.toLowerCase().includes(p.toLowerCase())));
    };

    const orderBuildHeader = findHeader(['order build', 'orderbuild', 'prices', 'mcpr', 'prices, mcpr']);
    const orderCompletionHeader = findHeader(['order completion', 'ordercompletion', 'completion', 'status sync', 'statussync']);
    const tcAssuranceHeader = findHeader(['t&c', 'tc assurance', 'tcassurance', 'comms', 'comms assurance', 'assurance']);
    const billingHeader = findHeader(['billing']);

    // SCALABLE EXTRACTION: Map raw rows to structured TestCases using AI's mapping
    const structuredCases = allRawData.map(row => {
      const extId = row[fieldMapping.externalId]?.toString() || '';
      const rawSummaryValue = row[fieldMapping.summary]?.toString() || 'No Summary';
      
      // Filter out invalid rows (mostly empty rows or padding)
      if (!extId && rawSummaryValue === 'No Summary') return null;

      // Combine ID and Summary for better dashboard visibility
      const combinedSummary = extId ? `${extId} - ${rawSummaryValue}` : rawSummaryValue;

      let stepsValue = row[fieldMapping.steps] || 'No Steps provided';
      if (typeof stepsValue === 'object' && stepsValue !== null) {
        stepsValue = JSON.stringify(stepsValue, null, 2);
      } else {
        stepsValue = stepsValue.toString();
      }

      // Gather standard validations
      const orderBuild = orderBuildHeader ? row[orderBuildHeader]?.toString() || null : null;
      const orderCompletion = orderCompletionHeader ? row[orderCompletionHeader]?.toString() || null : null;
      const tcAssurance = tcAssuranceHeader ? row[tcAssuranceHeader]?.toString() || null : null;
      const billing = billingHeader ? row[billingHeader]?.toString() || null : null;

      // Also support building a customValidations JSON array from any other validation columns if they are not standard
      const customValList = [];
      // If there are other columns containing 'validation' or 'check' or 'verify' that aren't the standard ones, we can import them
      headers.forEach(h => {
        const lowerH = h.toLowerCase();
        if (
          (lowerH.includes('validation') || lowerH.includes('checkpoint') || lowerH.includes('verify')) &&
          h !== orderBuildHeader &&
          h !== orderCompletionHeader &&
          h !== tcAssuranceHeader &&
          h !== billingHeader
        ) {
          const val = row[h]?.toString();
          if (val) {
            customValList.push({
              id: `sheet_${h.replace(/\s+/g, '_')}`,
              label: h,
              value: val,
              checked: false
            });
          }
        }
      });

      return {
        externalId: extId,
        summary: combinedSummary,
        steps: stepsValue,
        expectedResult: row[fieldMapping.expectedResult]?.toString() || 'No Expected Result',
        priority: (row[fieldMapping.priority]?.toString().toUpperCase() || 'MEDIUM'),
        module: row[fieldMapping.module]?.toString() || row._sheetName || 'Default',
        orderBuild,
        orderCompletion,
        tcAssurance,
        billing,
        customValidations: customValList.length > 0 ? JSON.stringify(customValList) : null
      };
    }).filter(c => c !== null);

    let targetProjectId = providedProjectId;

    // Project Discovery Logic
    if (aiProject && aiProject.name) {
      emitStatus(`AI Agent: Discovered Project Scope - "${aiProject.name}"`);
      
      // Theme mapping
      const themeMap = {
        "LIGHT": "#f8fafc",
        "BURGUNDY": "#1a1a2e",
        "BLACK": "#020617"
      };
      const themeColor = themeMap[aiProject.suggestedTheme?.toUpperCase()] || "#f8fafc";

      // Search by name first, scoped to this user, to avoid duplicates
      const existingByName = await prisma.project.findFirst({
        where: { name: aiProject.name, ownerId: req.user.id }
      });

      if (existingByName) {
        emitStatus('System: Syncing with existing project...');
        targetProjectId = existingByName.id;
      } else {
        emitStatus('System: Creating discovered project tab...');
        const newProject = await prisma.project.create({
          data: {
            name: aiProject.name,
            themeColor: themeColor,
            ownerId: req.user.id
          }
        });
        targetProjectId = newProject.id;
      }
    }

    if (!targetProjectId) {
      emitStatus('System: Creating baseline project tab...');
      const manualProjectName = req.body.manualProjectName;
      const fallbackName = (manualProjectName && manualProjectName !== 'null' && manualProjectName !== 'undefined')
        ? manualProjectName
        : (req.file?.originalname ? req.file.originalname.replace(/\.[^.]+$/, '') : 'Manual Import Project');

      // Check if a project with this name already exists for this user
      const existingProject = await prisma.project.findFirst({ where: { name: fallbackName, ownerId: req.user.id } });
      if (existingProject) {
        emitStatus('System: Syncing with existing project...');
        targetProjectId = existingProject.id;
      } else {
        const newProject = await prisma.project.create({
          data: { name: fallbackName, themeColor: '#f8fafc', ownerId: req.user.id }
        });
        targetProjectId = newProject.id;
      }
    }

    let suite = null;
    if (req.body.destination === 'lab') {
      emitStatus('Agent: Drafts loaded into Scenario Lab.');
    } else {
      emitStatus(`System: Saving ${structuredCases.length} test cases to suite...`);
      // Create Suite
      suite = await prisma.testSuite.create({
        data: {
          name: suiteName || `Import ${new Date().toLocaleDateString()}`,
          projectId: targetProjectId,
          testCases: {
            create: structuredCases
          }
        },
        include: { testCases: true }
      });
      emitStatus('Agent: Import Successful.');
    }

    res.json({
      message: req.body.destination === 'lab' ? 'Loaded to Lab' : 'Import successful',
      suiteId: suite ? suite.id : null,
      projectId: targetProjectId,
      count: suite ? suite.testCases.length : structuredCases.length,
      discoveredProject: aiProject?.name,
      structuredCases: structuredCases
    });
  } catch (error) {
    console.error('Upload Error:', error);
    emitStatus(`Critical Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
