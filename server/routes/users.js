const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { auth, isAdmin } = require('../middleware/auth');

// Apply auth to all routes
router.use(auth);

// Get all users (Admin only)
router.get('/all', isAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: { 
        _count: { select: { projects: true, assignments: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user details (Admin only)
router.patch('/:id/admin', isAdmin, async (req, res) => {
  const { id } = req.params;
  const { role, subscriptionStatus, subscriptionExpiresAt, name, email } = req.body;
  
  try {
    const updateData = {};
    if (role !== undefined) updateData.role = role;
    if (subscriptionStatus !== undefined) updateData.subscriptionStatus = subscriptionStatus;
    if (subscriptionExpiresAt !== undefined) updateData.subscriptionExpiresAt = subscriptionExpiresAt ? new Date(subscriptionExpiresAt) : null;
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;

    const user = await prisma.user.update({
      where: { id },
      data: updateData
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all testers
router.get('/', async (req, res) => {
  try {
    const testers = await prisma.user.findMany({
      where: { role: 'TESTER' },
      include: { assignments: true }
    });
    res.json(testers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new tester
router.post('/', async (req, res) => {
  const { name, email } = req.body;
  try {
    const user = await prisma.user.create({
      data: { name, email, role: 'TESTER' }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update tester
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id },
      data: { name, email }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete tester
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Delete assignments first to avoid foreign key issues
    await prisma.assignment.deleteMany({
      where: { testerId: id }
    });
    
    // 2. Delete user
    await prisma.user.delete({
      where: { id }
    });
    
    res.json({ message: 'Tester removed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
