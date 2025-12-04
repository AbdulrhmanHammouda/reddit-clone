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

module.exports = router;
