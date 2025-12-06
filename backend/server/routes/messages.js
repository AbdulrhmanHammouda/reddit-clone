const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const validateObjectId = require('../middleware/validateObjectId');
const Message = require('../models/Message');
const User = require('../models/User');
const createNotification = require('../utils/createNotification'); // 👈 added for notifications

// POST /api/messages - Send a new message
router.post('/', auth, async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    if (!receiverId || !content) {
      return res.status(400).json({ success: false, data: null, error: 'Receiver ID and content are required' });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ success: false, data: null, error: 'Receiver not found' });
    }

    const message = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      content,
    });

    // 🔔 Create notification for receiver
    await createNotification({
      user: receiverId,
      type: 'message',
      sourceUser: req.user._id
    });

    res.status(201).json({ success: true, data: message, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
});

// GET /api/messages/:receiverId - Get messages in a conversation
router.get('/:receiverId', auth, validateObjectId('receiverId'), async (req, res) => {
  try {
    const { receiverId } = req.params;
    const userId = req.user._id;

    // Mark messages as read
    await Message.updateMany(
      { sender: receiverId, receiver: userId, read: false },
      { read: true }
    );

    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: receiverId },
        { sender: receiverId, receiver: userId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate('sender', 'username')
      .populate('receiver', 'username');

    res.status(200).json({ success: true, data: messages, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
});

// GET /api/messages - List conversations for logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { receiver: userId }],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: {
              if: { $eq: ['$sender', userId] },
              then: '$receiver',
              else: '$sender',
            },
          },
          lastMessage: { $first: '$$ROOT' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'participant',
        },
      },
      { $unwind: '$participant' },
      {
        $project: {
          _id: 0,
          participant: {
            _id: '$participant._id',
            username: '$participant.username',
            avatar: '$participant.avatar',
          },
          lastMessage: {
            content: '$lastMessage.content',
            createdAt: '$lastMessage.createdAt',
            sender: '$lastMessage.sender',
            read: '$lastMessage.read',
          },
        },
      },
      { $sort: { 'lastMessage.createdAt': -1 } },
    ]);

    // Add unread count
    for (let convo of conversations) {
      convo.unreadCount = await Message.countDocuments({
        sender: convo.participant._id,
        receiver: userId,
        read: false,
      });
    }

    res.status(200).json({ success: true, data: conversations, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
});

module.exports = router;
