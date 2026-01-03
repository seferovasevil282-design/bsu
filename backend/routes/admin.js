const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const { authenticateAdmin, authenticateSuperAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        faculty: true,
        degree: true,
        course: true,
        isActive: true,
        reportCount: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const totalUsers = users.length;

    res.json({ users, totalUsers });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'İstifadəçilər yüklənmədi' });
  }
});

// Toggle user active status
router.patch('/users/:userId/toggle-active', authenticateAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'İstifadəçi tapılmadı' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive }
    });

    res.json({
      message: `İstifadəçi ${updatedUser.isActive ? 'aktiv' : 'deaktiv'} edildi`,
      user: updatedUser
    });
  } catch (error) {
    console.error('Toggle user error:', error);
    res.status(500).json({ error: 'Status dəyişdirilmədi' });
  }
});

// Get settings
router.get('/settings', authenticateAdmin, async (req, res) => {
  try {
    let settings = await prisma.settings.findFirst();
    if (!settings) {
      settings = await prisma.settings.create({ data: {} });
    }
    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Ayarlar yüklənmədi' });
  }
});

// Update rules
router.patch('/settings/rules', authenticateAdmin, async (req, res) => {
  try {
    const { rules } = req.body;

    let settings = await prisma.settings.findFirst();
    if (!settings) {
      settings = await prisma.settings.create({ data: { rules } });
    } else {
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: { rules }
      });
    }

    res.json({ message: 'Qaydalar yeniləndi', settings });
  } catch (error) {
    console.error('Update rules error:', error);
    res.status(500).json({ error: 'Qaydalar yenilənmədi' });
  }
});

// Update daily topic
router.patch('/settings/daily-topic', authenticateAdmin, async (req, res) => {
  try {
    const { dailyTopic } = req.body;

    let settings = await prisma.settings.findFirst();
    if (!settings) {
      settings = await prisma.settings.create({ data: { dailyTopic } });
    } else {
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: { dailyTopic }
      });
    }

    res.json({ message: 'Günün mövzusu yeniləndi', settings });
  } catch (error) {
    console.error('Update daily topic error:', error);
    res.status(500).json({ error: 'Günün mövzusu yenilənmədi' });
  }
});

// Update filtered words
router.patch('/settings/filtered-words', authenticateAdmin, async (req, res) => {
  try {
    const { filteredWords } = req.body;

    if (!Array.isArray(filteredWords)) {
      return res.status(400).json({ error: 'Filtr sözləri array olmalıdır' });
    }

    let settings = await prisma.settings.findFirst();
    if (!settings) {
      settings = await prisma.settings.create({ data: { filteredWords } });
    } else {
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: { filteredWords }
      });
    }

    res.json({ message: 'Filtr sözləri yeniləndi', settings });
  } catch (error) {
    console.error('Update filtered words error:', error);
    res.status(500).json({ error: 'Filtr sözləri yenilənmədi' });
  }
});

// Update message deletion hours
router.patch('/settings/deletion-hours', authenticateAdmin, async (req, res) => {
  try {
    const { groupChatDeletionHours, privateChatDeletionHours } = req.body;

    let settings = await prisma.settings.findFirst();
    if (!settings) {
      settings = await prisma.settings.create({
        data: { groupChatDeletionHours, privateChatDeletionHours }
      });
    } else {
      const updateData = {};
      if (groupChatDeletionHours !== undefined) updateData.groupChatDeletionHours = parseInt(groupChatDeletionHours);
      if (privateChatDeletionHours !== undefined) updateData.privateChatDeletionHours = parseInt(privateChatDeletionHours);

      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: updateData
      });
    }

    res.json({ message: 'Silinmə vaxtı yeniləndi', settings });
  } catch (error) {
    console.error('Update deletion hours error:', error);
    res.status(500).json({ error: 'Silinmə vaxtı yenilənmədi' });
  }
});

// Get reported users (16+ reports)
router.get('/reported-users', authenticateAdmin, async (req, res) => {
  try {
    const reportedUsers = await prisma.user.findMany({
      where: {
        reportCount: {
          gte: 16
        }
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        faculty: true,
        degree: true,
        course: true,
        reportCount: true,
        isActive: true,
        createdAt: true
      },
      orderBy: {
        reportCount: 'desc'
      }
    });

    res.json({ reportedUsers });
  } catch (error) {
    console.error('Get reported users error:', error);
    res.status(500).json({ error: 'Şikayət edilən istifadəçilər yüklənmədi' });
  }
});

// Create sub-admin (super admin only)
router.post('/sub-admins', authenticateSuperAdmin, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'İstifadəçi adı və şifrə tələb olunur' });
    }

    // Check if admin exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { username }
    });

    if (existingAdmin) {
      return res.status(400).json({ error: 'Bu istifadəçi adı artıq mövcuddur' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = await prisma.admin.create({
      data: {
        username,
        password: hashedPassword,
        isSuper: false
      },
      select: {
        id: true,
        username: true,
        isSuper: true,
        createdAt: true
      }
    });

    res.status(201).json({ message: 'Alt admin yaradıldı', admin: newAdmin });
  } catch (error) {
    console.error('Create sub-admin error:', error);
    res.status(500).json({ error: 'Alt admin yaradılmadı' });
  }
});

// Get all admins (super admin only)
router.get('/sub-admins', authenticateSuperAdmin, async (req, res) => {
  try {
    const admins = await prisma.admin.findMany({
      where: {
        isSuper: false
      },
      select: {
        id: true,
        username: true,
        isSuper: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ admins });
  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({ error: 'Adminlər yüklənmədi' });
  }
});

// Delete sub-admin (super admin only)
router.delete('/sub-admins/:adminId', authenticateSuperAdmin, async (req, res) => {
  try {
    const { adminId } = req.params;

    const admin = await prisma.admin.findUnique({
      where: { id: adminId }
    });

    if (!admin) {
      return res.status(404).json({ error: 'Admin tapılmadı' });
    }

    if (admin.isSuper) {
      return res.status(403).json({ error: 'Super admin silinə bilməz' });
    }

    await prisma.admin.delete({
      where: { id: adminId }
    });

    res.json({ message: 'Alt admin silindi' });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({ error: 'Admin silinmədi' });
  }
});

module.exports = router;
