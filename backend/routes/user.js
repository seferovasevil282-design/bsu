const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const prisma = require('../config/database');
const { authenticateUser } = require('../middleware/auth');

const router = express.Router();

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/profiles');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Yalnız şəkil faylları (JPEG, PNG, GIF, WebP) yükləyə bilərsiniz'));
    }
  }
});

// Get current user profile
router.get('/me', authenticateUser, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Profil yüklənmədi' });
  }
});

// Update profile picture
router.post('/profile-picture', authenticateUser, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Şəkil seçilməyib' });
    }

    const profilePicturePath = `/uploads/profiles/${req.file.filename}`;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { profilePicture: profilePicturePath },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        faculty: true,
        degree: true,
        course: true,
        profilePicture: true
      }
    });

    res.json({
      message: 'Profil şəkli yeniləndi',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile picture error:', error);
    res.status(500).json({ error: 'Profil şəkli yenilənmədi' });
  }
});

// Get users by faculty
router.get('/faculty/:faculty', authenticateUser, async (req, res) => {
  try {
    const { faculty } = req.params;

    const users = await prisma.user.findMany({
      where: {
        faculty,
        isActive: true
      },
      select: {
        id: true,
        fullName: true,
        faculty: true,
        degree: true,
        course: true,
        profilePicture: true
      },
      orderBy: {
        fullName: 'asc'
      }
    });

    res.json({ users });
  } catch (error) {
    console.error('Get faculty users error:', error);
    res.status(500).json({ error: 'İstifadəçilər yüklənmədi' });
  }
});

// Get blocked users
router.get('/blocked', authenticateUser, async (req, res) => {
  try {
    const blocks = await prisma.block.findMany({
      where: {
        blockerId: req.user.id
      },
      include: {
        blocked: {
          select: {
            id: true,
            fullName: true,
            faculty: true,
            degree: true,
            course: true,
            profilePicture: true
          }
        }
      }
    });

    const blockedUsers = blocks.map(block => block.blocked);

    res.json({ blockedUsers });
  } catch (error) {
    console.error('Get blocked users error:', error);
    res.status(500).json({ error: 'Əngəllənmiş istifadəçilər yüklənmədi' });
  }
});

module.exports = router;
