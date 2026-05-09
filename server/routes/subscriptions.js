const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { auth, isAdmin } = require('../middleware/auth');

// Apply auth to all routes
router.use(auth);

// Get my subscription requests
router.get('/my', async (req, res) => {
  try {
    const subs = await prisma.subscriptionRequest.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(subs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit a new subscription request
router.post('/', async (req, res) => {
  const { method, transactionId } = req.body;
  
  if (!method) return res.status(400).json({ error: 'Payment method is required' });

  try {
    const sub = await prisma.subscriptionRequest.create({
      data: {
        userId: req.user.id,
        method,
        transactionId,
        amount: 100.0,
        status: 'PENDING'
      }
    });
    res.json(sub);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Get all pending requests
router.get('/pending', isAdmin, async (req, res) => {
  try {
    const pending = await prisma.subscriptionRequest.findMany({
      where: { status: 'PENDING' },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'asc' }
    });
    res.json(pending);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Get ALL requests (full history)
router.get('/all', isAdmin, async (req, res) => {
  try {
    const all = await prisma.subscriptionRequest.findMany({
      include: { user: { select: { name: true, email: true, subscriptionStatus: true, subscriptionExpiresAt: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(all);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Approve or Reject request
router.patch('/:id/status', isAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // APPROVED or REJECTED

  if (!['APPROVED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const sub = await prisma.subscriptionRequest.update({
      where: { id },
      data: { status }
    });

    if (status === 'APPROVED') {
      // Calculate expiry: 1 month from now
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      await prisma.user.update({
        where: { id: sub.userId },
        data: {
          subscriptionStatus: 'ACTIVE',
          lastBillingDate: new Date(),
          subscriptionExpiresAt: expiresAt
        }
      });
    }

    res.json(sub);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
