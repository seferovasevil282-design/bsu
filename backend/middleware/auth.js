const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

async function authenticateUser(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token yoxdur' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Yanlış token' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        faculty: true,
        degree: true,
        course: true,
        profilePicture: true,
        isActive: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'İstifadəçi tapılmadı və ya deaktiv edilib' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Autentifikasiya xətası' });
  }
}

async function authenticateAdmin(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token yoxdur' });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.adminId) {
      return res.status(401).json({ error: 'Yanlış token' });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: decoded.adminId }
    });

    if (!admin) {
      return res.status(401).json({ error: 'Admin tapılmadı' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(401).json({ error: 'Autentifikasiya xətası' });
  }
}

async function authenticateSuperAdmin(req, res, next) {
  try {
    await authenticateAdmin(req, res, () => {});
    
    if (!req.admin || !req.admin.isSuper) {
      return res.status(403).json({ error: 'Super admin icazəsi tələb olunur' });
    }

    next();
  } catch (error) {
    console.error('Super admin auth error:', error);
    res.status(403).json({ error: 'Giriş qadağandır' });
  }
}

module.exports = {
  generateToken,
  verifyToken,
  authenticateUser,
  authenticateAdmin,
  authenticateSuperAdmin
};
