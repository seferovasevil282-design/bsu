const bcrypt = require('bcryptjs');
const prisma = require('../config/database');

async function initializeSuperAdmin() {
  try {
    const username = process.env.SUPER_ADMIN_USERNAME || 'ursamajor';
    const password = process.env.SUPER_ADMIN_PASSWORD || 'ursa618';

    const existingAdmin = await prisma.admin.findUnique({
      where: { username }
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.admin.create({
        data: {
          username,
          password: hashedPassword,
          isSuper: true
        }
      });
      console.log('Super admin created successfully');
    } else {
      console.log('Super admin already exists');
    }
  } catch (error) {
    console.error('Super admin initialization error:', error);
    throw error;
  }
}

module.exports = { initializeSuperAdmin };
