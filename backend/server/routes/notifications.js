const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Notification = require('../models/Notification');
const validateObjectId = require('../middleware/validateObjectId');

// GET /api/notifications - Get notifications for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sourceUser', 'username avatar')
      .populate('sourcePost', '_id title')
      .populate('sourceComment', 'body')
      .populate('sourceCommunity', 'name');

    const totalNotifications = await Notification.countDocuments({ user: req.user._id });
    const totalPages = Math.ceil(totalNotifications / limit);

    res.status(200).json({
      success: true,
      data: notifications,
      page,
      totalPages,
      error: null,
    });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
});

// GET /api/notifications/unread-count - Get unread notification count
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ user: req.user._id, read: false });
    res.status(200).json({ success: true, data: { count }, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
});

// PATCH /api/notifications/read-all - Mark all notifications as read
router.patch('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, read: false },
      { read: true }
    );
    res.status(200).json({ success: true, data: null, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
});

// PATCH /api/notifications/:id/read - Mark a notification as read
router.patch('/:id/read', auth, validateObjectId('id'), async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { read: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ success: false, data: null, error: 'Notification not found' });
        }

        res.status(200).json({ success: true, data: notification, error: null });
    } catch (err) {
        res.status(500).json({ success: false, data: null, error: err.message });
    }
});

module.exports = router;