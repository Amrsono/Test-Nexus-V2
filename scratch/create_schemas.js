const fs = require('fs');
const schemasContent = `/**
 * Input validation schemas for routes
 */

const createDefectSchema = {
  projectId: { required: true, type: 'string' },
  title: { required: true, type: 'string' },
  severity: { type: 'string', pattern: /^(P1|P2|P3|P4)$/ },
  status: { type: 'string', pattern: /^(OPEN|FIXED|VERIFIED|CLOSED)$/ }
};

const updateDefectSchema = {
  title: { type: 'string' },
  severity: { type: 'string', pattern: /^(P1|P2|P3|P4)$/ },
  status: { type: 'string', pattern: /^(OPEN|FIXED|VERIFIED|CLOSED)$/ },
  assignedTo: { type: 'string' }
};

const createTestCaseSchema = {
  summary: { required: true, type: 'string' },
  priority: { type: 'string', pattern: /^(CRITICAL|HIGH|MEDIUM|LOW)$/i },
  module: { type: 'string' },
  steps: { type: 'string' },
  expectedResult: { type: 'string' },
  suiteId: { type: 'string' }
};

const updateTestCaseSchema = {
  summary: { type: 'string' },
  priority: { type: 'string', pattern: /^(CRITICAL|HIGH|MEDIUM|LOW)$/i },
  status: { type: 'string', pattern: /^(PENDING|IN PROGRESS|PASS|FAIL|BLOCKED)$/i },
  module: { type: 'string' }
};

const resetTestCasesSchema = {
  projectId: { required: true, type: 'string' }
};

const createProjectSchema = {
  name: { required: true, type: 'string' },
  description: { type: 'string' },
  themeColor: { type: 'string' }
};

const loginSchema = {
  email: { required: true, type: 'string', pattern: /^[^@\s]+@[^@\s]+\.[^@\s]+$/ },
  password: { required: true, type: 'string' }
};

const registerSchema = {
  email: { required: true, type: 'string', pattern: /^[^@\s]+@[^@\s]+\.[^@\s]+$/ },
  password: { required: true, type: 'string' },
  name: { type: 'string' }
};

module.exports = {
  createDefectSchema,
  updateDefectSchema,
  createTestCaseSchema,
  updateTestCaseSchema,
  resetTestCasesSchema,
  createProjectSchema,
  loginSchema,
  registerSchema
};
`;

fs.writeFileSync('server/middleware/schemas.js', schemasContent);
console.log('Created server/middleware/schemas.js');
