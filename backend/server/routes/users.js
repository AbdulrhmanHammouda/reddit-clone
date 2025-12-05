const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const multer = require('multer');
const { storage } = require('../utils/cloudinary');
const User = require('../models/User');

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Invalid file type'));
    }
    cb(null, true);
  },
});

// POST /api/users/upload-avatar
router.post('/upload-avatar', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file || !req.file.path) return res.status(400).json({ error: 'No file uploaded' });
    const url = req.file.path;
    const user = await User.findByIdAndUpdate(req.user._id, { avatar: url }, { new: true }).select('-passwordHash');
    res.json({ id: user._id, username: user.username, email: user.email, avatar: user.avatar });
  } catch (err) {
    // Multer file size error
    if (err && err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File too large (max 5MB)' });
    if (err && err.message === 'Invalid file type') return res.status(400).json({ error: 'Invalid file type' });
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/users/me
router.patch('/me', auth, async (req, res) => {
  try {
    const updates = {};
    const allowed = ['bio', 'avatar', 'displayName'];
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-passwordHash');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:username (public profile)
router.get('/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select('username displayName bio avatar createdAt');
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
