const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { auth, isAdmin } = require('../middleware/auth');

// GET /api/settings/public - Accessible to all logged in users
router.get('/public', auth, async (req, res) => {
  try {
    const settings = await prisma.systemSettings.findMany();
    const publicSettings = settings.reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {});
    res.json(publicSettings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/settings - Admin only
router.get('/', auth, isAdmin, async (req, res) => {
  try {
    const settings = await prisma.systemSettings.findMany();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/settings - Admin only (Batch update or create)
router.post('/', auth, isAdmin, async (req, res) => {
  const { settings } = req.body; // Array of { key, value }
  
  if (!settings || !Array.isArray(settings)) {
    return res.status(400).json({ error: 'Settings array is required' });
  }

  try {
    const operations = settings.map(s => 
      prisma.systemSettings.upsert({
        where: { key: s.key },
        update: { value: s.value },
        create: { key: s.key, value: s.value }
      })
    );
    
    await Promise.all(operations);
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
