const express = require('express');
const prisma = require('../config/database');
const { authenticateUser } = require('../middleware/auth');

const router = express.Router();

// Get group messages for a room
router.get('/group/:roomId', authenticateUser, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit = 50, before } = req.query;

    // Get blocked user IDs
    const blocks = await prisma.block.findMany({
      where: {
        OR: [
          { blockerId: req.user.id },
          { blockedId: req.user.id }
        ]
      },
      select: {
        blockerId: true,
        blockedId: true
      }
    });

    const blockedUserIds = new Set();
    blocks.forEach(block => {
      if (block.blockerId === req.user.id) {
        blockedUserIds.add(block.blockedId);
      } else {
        blockedUserIds.add(block.blockerId);
      }
    });

    const whereClause = {
      roomId,
      isPrivate: false,
      senderId: {
        notIn: Array.from(blockedUserIds)
      }
    };

    if (before) {
      whereClause.createdAt = {
        lt: new Date(before)
      };
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
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
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit)
    });

    res.json({ messages: messages.reverse() });
  } catch (error) {
    console.error('Get group messages error:', error);
    res.status(500).json({ error: 'Mesajlar yüklənmədi' });
  }
});

// Get private messages with a user
router.get('/private/:userId', authenticateUser, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, before } = req.query;

    // Check if blocked
    const blocked = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: req.user.id, blockedId: userId },
          { blockerId: userId, blockedId: req.user.id }
        ]
      }
    });

    if (blocked) {
      return res.status(403).json({ error: 'Bu istifadəçi ilə mesajlaşa bilməzsiniz' });
    }

    const whereClause = {
      isPrivate: true,
      OR: [
        { senderId: req.user.id, receiverId: userId },
        { senderId: userId, receiverId: req.user.id }
      ]
    };

    if (before) {
      whereClause.createdAt = {
        lt: new Date(before)
      };
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
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
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit)
    });

    res.json({ messages: messages.reverse() });
  } catch (error) {
    console.error('Get private messages error:', error);
    res.status(500).json({ error: 'Mesajlar yüklənmədi' });
  }
});

// Get private conversations list
router.get('/conversations', authenticateUser, async (req, res) => {
  try {
    const conversations = await prisma.$queryRaw`
      SELECT DISTINCT
        CASE 
          WHEN "senderId" = ${req.user.id} THEN "receiverId"
          ELSE "senderId"
        END as "userId",
        MAX("createdAt") as "lastMessageAt"
      FROM messages
      WHERE "isPrivate" = true
        AND ("senderId" = ${req.user.id} OR "receiverId" = ${req.user.id})
      GROUP BY "userId"
      ORDER BY "lastMessageAt" DESC
    `;

    // Get user details for each conversation
    const conversationsWithUsers = await Promise.all(
      conversations.map(async (conv) => {
        const user = await prisma.user.findUnique({
          where: { id: conv.userId },
          select: {
            id: true,
            fullName: true,
            faculty: true,
            degree: true,
            course: true,
            profilePicture: true,
            isActive: true
          }
        });

        // Get last message
        const lastMessage = await prisma.message.findFirst({
          where: {
            isPrivate: true,
            OR: [
              { senderId: req.user.id, receiverId: conv.userId },
              { senderId: conv.userId, receiverId: req.user.id }
            ]
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        return {
          user,
          lastMessage,
          lastMessageAt: conv.lastMessageAt
        };
      })
    );

    res.json({ conversations: conversationsWithUsers.filter(c => c.user) });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Söhbətlər yüklənmədi' });
  }
});

module.exports = router;
