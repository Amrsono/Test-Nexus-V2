const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketManager = require('./socket');
const prisma = require('./lib/prisma');

const path = require('path');
dotenv.config(); // Default fallback
dotenv.config({ path: path.join(__dirname, '../.env') }); // Explicit path for local dev

const app = express();
const server = http.createServer(app);
const io = socketManager.init(server);

const PORT = process.env.PORT || 5000;

const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
    ];
    // Allow any Vercel deployment and local dev
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Basic sanity check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'TestNexus API is running' });
});

// Import Routes
const projectRoutes = require('./routes/projects');
const testCaseRoutes = require('./routes/testCases');
const uploadRoutes = require('./routes/upload');
const assignmentRoutes = require('./routes/assignments');
const insightRoutes = require('./routes/insights');
const userRoutes = require('./routes/users');
const reportRoutes = require('./routes/reports');
const generatorRoutes = require('./routes/generator');
const defectRoutes = require('./routes/defects');

app.use('/api/projects', projectRoutes);
app.use('/api/test-cases', testCaseRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/generator', generatorRoutes);
app.use('/api/defects', defectRoutes);

// Export app for Vercel
module.exports = app;

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} with Agent Socket active`);
  });
}
