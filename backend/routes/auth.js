const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const { generateToken } = require('../middleware/auth');
const { getRandomQuestions, validateAnswers } = require('../utils/constants');

const router = express.Router();

// Get verification questions
router.get('/verification-questions', (req, res) => {
  try {
    const questions = getRandomQuestions(3);
    res.json({ questions: questions.map(q => ({ id: q.id, question: q.question })) });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ error: 'Suallar yüklənmədi' });
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { fullName, phone, email, password, faculty, degree, course, verificationAnswers } = req.body;

    // Validate required fields
    if (!fullName || !phone || !email || !password || !faculty || !degree || !course) {
      return res.status(400).json({ error: 'Bütün xanaları doldurun' });
    }

    // Validate phone format (+994XXXXXXXXX)
    if (!/^\+994\d{9}$/.test(phone)) {
      return res.status(400).json({ error: 'Telefon nömrəsi düzgün deyil (+994XXXXXXXXX)' });
    }

    // Validate email domain
    if (!email.endsWith('@bsu.edu.az')) {
      return res.status(400).json({ error: 'Email @bsu.edu.az ilə bitməlidir' });
    }

    // Validate course
    if (course < 1 || course > 6) {
      return res.status(400).json({ error: 'Kurs 1-6 arasında olmalıdır' });
    }

    // Validate verification answers
    if (!verificationAnswers || !Array.isArray(verificationAnswers) || verificationAnswers.length !== 3) {
      return res.status(400).json({ error: 'Doğrulama suallarını cavablandırın' });
    }

    if (!validateAnswers(verificationAnswers)) {
      return res.status(400).json({ error: 'Minimum 2 sual düzgün cavablandırılmalıdır' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { phone }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Bu email və ya telefon nömrəsi artıq qeydiyyatdan keçib' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        fullName,
        phone,
        email,
        password: hashedPassword,
        faculty,
        degree,
        course: parseInt(course)
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        faculty: true,
        degree: true,
        course: true,
        profilePicture: true,
        createdAt: true
      }
    });

    // Generate token
    const token = generateToken({ userId: user.id });

    res.status(201).json({
      message: 'Qeydiyyat uğurla tamamlandı',
      user,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Qeydiyyat zamanı xəta baş verdi' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email və şifrə daxil edin' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Email və ya şifrə yanlışdır' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Hesabınız deaktiv edilib' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Email və ya şifrə yanlışdır' });
    }

    // Generate token
    const token = generateToken({ userId: user.id });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Giriş uğurlu',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Giriş zamanı xəta baş verdi' });
  }
});

// Admin login
router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'İstifadəçi adı və şifrə daxil edin' });
    }

    // Find admin
    const admin = await prisma.admin.findUnique({
      where: { username }
    });

    if (!admin) {
      return res.status(401).json({ error: 'İstifadəçi adı və ya şifrə yanlışdır' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'İstifadəçi adı və ya şifrə yanlışdır' });
    }

    // Generate token
    const token = generateToken({ adminId: admin.id, isSuper: admin.isSuper });

    // Return admin without password
    const { password: _, ...adminWithoutPassword } = admin;

    res.json({
      message: 'Admin girişi uğurlu',
      admin: adminWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Giriş zamanı xəta baş verdi' });
  }
});

module.exports = router;
