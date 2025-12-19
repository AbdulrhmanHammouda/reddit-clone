const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const validateObjectId = require('../middleware/validateObjectId');
const upload = require('../middleware/upload');
const Message = require('../models/Message');
const User = require('../models/User');
const createNotification = require('../utils/createNotification');

// POST /api/messages - Send a new message (with optional attachment)
router.post('/', auth, upload.single('attachment'), async (req, res) => {
  try {
    const { receiverId, content } = req.body;

    if (!receiverId) {
      return res.status(400).json({ success: false, data: null, error: 'Receiver ID is required' });
    }

    // Need either content or attachment
    if (!content && !req.file) {
      return res.status(400).json({ success: false, data: null, error: 'Content or attachment is required' });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ success: false, data: null, error: 'Receiver not found' });
    }

    // Check if receiver allows direct messages
    if (receiver.settings?.allowDirectMessages === false) {
      return res.status(403).json({
        success: false,
        data: null,
        error: 'This user does not accept direct messages'
      });
    }

    // Prepare message data
    const messageData = {
      sender: req.user._id,
      receiver: receiverId,
      content: content || '',
    };

    // Handle attachment if uploaded
    if (req.file) {
      const fileType = req.file.mimetype.startsWith('image/') ? 'image'
        : req.file.mimetype.startsWith('video/') ? 'video'
          : 'file';

      messageData.attachment = {
        url: req.file.path, // Cloudinary returns the URL in path
        type: fileType,
        filename: req.file.originalname,
      };
    }

    const message = await Message.create(messageData);

    // Create notification for receiver only if they have enabled chatMessageNotifications
    if (receiver.settings?.chatMessageNotifications !== false) {
      await createNotification({
        user: receiverId,
        type: 'message',
        sourceUser: req.user._id
      });
    }

    res.status(201).json({ success: true, data: message, error: null });
  } catch (err) {
    console.error('Message send error:', err);
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
      .populate('sender', 'username avatar')
      .populate('receiver', 'username avatar');

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
            attachment: '$lastMessage.attachment',
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
