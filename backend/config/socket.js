const prisma = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const moment = require('moment-timezone');

const connectedUsers = new Map(); // userId -> socketId
const BAKU_TIMEZONE = 'Asia/Baku';

function initializeSocket(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Token yoxdur'));
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        return next(new Error('Yanlış token'));
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          fullName: true,
          email: true,
          faculty: true,
          degree: true,
          course: true,
          profilePicture: true,
          isActive: true
        }
      });

      if (!user || !user.isActive) {
        return next(new Error('İstifadəçi tapılmadı'));
      }

      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket auth error:', error);
      next(new Error('Autentifikasiya xətası'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.fullName} (${socket.id})`);
    connectedUsers.set(socket.user.id, socket.id);

    // Join faculty room
    socket.join(socket.user.faculty);

    // Handle group messages
    socket.on('group_message', async (data) => {
      try {
        const { roomId, content } = data;
        
        // Filter words
        const settings = await getSettings();
        let filteredContent = content;
        const words = settings.filteredWords ? settings.filteredWords.split(',').map(w => w.trim()) : [];
        words.forEach(word => {
          if (word) {
            const regex = new RegExp(word, 'gi');
            filteredContent = filteredContent.replace(regex, '*'.repeat(word.length));
          }
        });

        // Save message
        const message = await prisma.message.create({
          data: {
            content: filteredContent,
            roomId,
            senderId: socket.user.id,
            timestamp: moment().tz(BAKU_TIMEZONE).toDate()
          },
          include: {
            sender: {
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

        // Get blocked users for this room
        const blockedRelations = await prisma.block.findMany({
          where: {
            OR: [
              { blockerId: socket.user.id },
              { blockedId: socket.user.id }
            ]
          }
        });

        // Send to room members except blocked users
        const roomSockets = await io.in(roomId).fetchSockets();
        roomSockets.forEach(roomSocket => {
          const isBlocked = blockedRelations.some(block => 
            (block.blockerId === roomSocket.user.id && block.blockedId === socket.user.id) ||
            (block.blockedId === roomSocket.user.id && block.blockerId === socket.user.id)
          );

          if (!isBlocked) {
            roomSocket.emit('new_message', message);
          }
        });

        scheduleMessageDeletion(message.id, settings.groupChatDeletionHours);
      } catch (error) {
        console.error('Group message error:', error);
        socket.emit('error', { message: 'Mesaj göndərilmədi' });
      }
    });

    // Handle private messages
    socket.on('private_message', async (data) => {
      try {
        const { receiverId, content } = data;

        // Check if blocked
        const blocked = await prisma.block.findFirst({
          where: {
            OR: [
              { blockerId: socket.user.id, blockedId: receiverId },
              { blockerId: receiverId, blockedId: socket.user.id }
            ]
          }
        });

        if (blocked) {
          return socket.emit('error', { message: 'Bu istifadəçi ilə mesajlaşa bilməzsiniz' });
        }

        // Filter words
        const settings = await getSettings();
        let filteredContent = content;
        const words = settings.filteredWords ? settings.filteredWords.split(',').map(w => w.trim()) : [];
        words.forEach(word => {
          if (word) {
            const regex = new RegExp(word, 'gi');
            filteredContent = filteredContent.replace(regex, '*'.repeat(word.length));
          }
        });

        // Save message
        const message = await prisma.message.create({
          data: {
            content: filteredContent,
            isPrivate: true,
            senderId: socket.user.id,
            receiverId,
            timestamp: moment().tz(BAKU_TIMEZONE).toDate()
          },
          include: {
            sender: {
              select: {
                id: true,
                fullName: true,
                faculty: true,
                degree: true,
                course: true,
                profilePicture: true
              }
            },
            receiver: {
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

        // Send to both users
        socket.emit('new_private_message', message);
        const receiverSocketId = connectedUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('new_private_message', message);
        }

        scheduleMessageDeletion(message.id, settings.privateChatDeletionHours);
      } catch (error) {
        console.error('Private message error:', error);
        socket.emit('error', { message: 'Mesaj göndərilmədi' });
      }
    });

    // Handle block user
    socket.on('block_user', async (data) => {
      try {
        const { userId } = data;
        
        await prisma.block.create({
          data: {
            blockerId: socket.user.id,
            blockedId: userId
          }
        });

        socket.emit('user_blocked', { userId });
      } catch (error) {
        console.error('Block error:', error);
        socket.emit('error', { message: 'Əngəlləmə uğursuz oldu' });
      }
    });

    // Handle unblock user
    socket.on('unblock_user', async (data) => {
      try {
        const { userId } = data;
        
        await prisma.block.deleteMany({
          where: {
            blockerId: socket.user.id,
            blockedId: userId
          }
        });

        socket.emit('user_unblocked', { userId });
      } catch (error) {
        console.error('Unblock error:', error);
      }
    });

    // Handle report user
    socket.on('report_user', async (data) => {
      try {
        const { userId } = data;
        
        await prisma.report.create({
          data: {
            reporterId: socket.user.id,
            reportedId: userId
          }
        });

        // Increment report count
        await prisma.user.update({
          where: { id: userId },
          data: {
            reportCount: {
              increment: 1
            }
          }
        });

        socket.emit('user_reported', { userId });
      } catch (error) {
        console.error('Report error:', error);
        socket.emit('error', { message: 'Şikayət göndərilmədi' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.fullName}`);
      connectedUsers.delete(socket.user.id);
    });
  });

  // Broadcast settings updates
  setInterval(async () => {
    try {
      const settings = await getSettings();
      io.emit('settings_update', {
        dailyTopic: settings.dailyTopic,
        rules: settings.rules
      });
    } catch (error) {
      console.error('Settings broadcast error:', error);
    }
  }, 60000); // Every minute
}

async function getSettings() {
  let settings = await prisma.settings.findFirst();
  if (!settings) {
    settings = await prisma.settings.create({
      data: {}
    });
  }
  return settings;
}

async function scheduleMessageDeletion(messageId, hours) {
  setTimeout(async () => {
    try {
      await prisma.message.delete({
        where: { id: messageId }
      });
    } catch (error) {
      console.error('Message deletion error:', error);
    }
  }, hours * 60 * 60 * 1000);
}

module.exports = { initializeSocket, connectedUsers };
