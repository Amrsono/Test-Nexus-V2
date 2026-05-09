const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretnexus';

const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Check if trial has expired
    if (user.subscriptionStatus === 'TRIAL' && user.trialEndsAt < new Date()) {
      await prisma.user.update({
        where: { id: user.id },
        data: { subscriptionStatus: 'EXPIRED' }
      });
      user.subscriptionStatus = 'EXPIRED';
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ error: 'Admin access required' });
  }
};

const canImport = (req, res, next) => {
  if (req.user && (req.user.subscriptionStatus === 'ACTIVE' || req.user.role === 'ADMIN')) {
    next();
  } else {
    res.status(403).json({ 
      error: 'Trial Restriction: Importing reports or sheets is only available for premium subscribers (£100/mo). Upgrade to unlock.' 
    });
  }
};

module.exports = { auth, isAdmin, canImport };
