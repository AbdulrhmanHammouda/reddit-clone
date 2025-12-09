// backend/routes/posts.js
const express = require('express');
const router = express.Router();

const validateObjectId = require('../middleware/validateObjectId');
const auth = require('../middleware/authMiddleware');
const { writeLimiter } = require('../middleware/rateLimiter');

const Community = require('../models/Community');
const Post = require('../models/Post');
const Vote = require('../models/Vote');
const Comment = require('../models/Comment');
const SavedPost = require('../models/SavedPost');

const multer = require('multer');
const { storage } = require('../utils/cloudinary');
const upload = multer({ storage });

/* ---------------------------------------------------------------------------
   📌 CREATE IMAGE / VIDEO POST
--------------------------------------------------------------------------- */
router.post('/image', auth, writeLimiter, upload.single('image'), async (req, res) => {
  try {
    const { title, body, communityName } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    const community = await Community.findOne({ name: communityName });
    if (!community) {
      return res.status(404).json({ success: false, error: "Community not found" });
    }

    const post = await Post.create({
      title,
      body: body || "",
      author: req.user._id,
      community: community._id,
      imageUrl: req.file.path
    });

    const populated = await Post.findById(post._id)
      .populate('author', 'username avatar')
      .populate('community', 'name title icon');

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ---------------------------------------------------------------------------
   📌 CREATE TEXT/LINK POST
--------------------------------------------------------------------------- */
router.post('/', auth, writeLimiter, async (req, res) => {
  try {
    const { title, body, communityName, url } = req.body;

    const community = await Community.findOne({ name: communityName });
    if (!community) {
      return res.status(404).json({ success: false, error: "Community not found" });
    }

    const post = await Post.create({
      title,
      body: body || "",
      author: req.user._id,
      community: community._id,
      url: url || null
    });

    const populated = await Post.findById(post._id)
      .populate('author', 'username avatar')
      .populate('community', 'name title icon');

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ---------------------------------------------------------------------------
   📌 GET SINGLE POST + YOUR VOTE
--------------------------------------------------------------------------- */
router.get('/:id', validateObjectId('id'), async (req, res) => {
  try {
    const authorization = req.headers.authorization;
    let userId = null;

    // decode token if provided
    if (authorization?.startsWith("Bearer ")) {
      const token = authorization.split(" ")[1];
      try {
        const jwt = require("jsonwebtoken");
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");
        userId = decoded.id;
      } catch (err) {
        userId = null; // guest — allow access
      }
    }

    const post = await Post.findById(req.params.id)
      .populate('author', 'username avatar')
      .populate('community', 'name title icon');

    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    // include user vote only if logged in
    let yourVote = 0;
    if (userId) {
      const v = await Vote.findOne({ user: userId, post: post._id });
      if (v) yourVote = v.value;
    }

    res.status(200).json({
      success: true,
      data: { ...post.toObject(), yourVote }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

 

/* ---------------------------------------------------------------------------
   🔺🔻 VOTING SYSTEM (direction field)
--------------------------------------------------------------------------- */
/* ---------------------------------------------------------------------------
   🔺🔻 FINAL VOTING SYSTEM (value field only)
--------------------------------------------------------------------------- */
router.post('/:id/vote', auth, validateObjectId('id'), async (req, res) => {
  try {
    const value = Number(req.body.value); // <-- FIXED
    const postId = req.params.id;
    const userId = req.user._id;

    if (![1, -1, 0].includes(value)) {
      return res.status(400).json({ success: false, error: "Invalid vote" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }

    let existing = await Vote.findOne({ user: userId, post: postId });

    // First time voting
    if (!existing) {
      if (value !== 0) {
        await Vote.create({ user: userId, post: postId, value });
        post.score += value;
      }
    }
    // Unvote
    else if (value === 0) {
      post.score -= existing.value;
      await existing.deleteOne();
    }
    // Switch vote
    else if (existing.value !== value) {
      post.score += value * 2;
      existing.value = value;
      await existing.save();
    }
    // Same vote → remove it
    else {
      post.score -= existing.value;
      await existing.deleteOne();
    }

    await post.save();

    const updated = await Vote.findOne({ user: userId, post: postId });
    const yourVote = updated ? updated.value : 0;

    res.json({
      success: true,
      data: { score: post.score, yourVote }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});


/* ---------------------------------------------------------------------------
   🖊 EDIT POST
--------------------------------------------------------------------------- */
router.patch('/:id', auth, writeLimiter, validateObjectId('id'), async (req, res) => {
  try {
    const allowed = ['title', 'body', 'url'];
    const updates = {};

    allowed.forEach(k => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });

    const post = await Post.findOneAndUpdate(
      { _id: req.params.id, author: req.user._id },
      { $set: updates },
      { new: true }
    )
      .populate('author', 'username avatar')
      .populate('community', 'name title icon');

    if (!post) {
      return res.status(403).json({ success: false, error: 'Not owner' });
    }

    res.json({ success: true, data: post });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ---------------------------------------------------------------------------
   🗑 DELETE POST + CLEANUP
--------------------------------------------------------------------------- */
router.delete('/:id', auth, writeLimiter, validateObjectId('id'), async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, author: req.user._id });
    if (!post) {
      return res.status(403).json({ success: false, error: "Not authorized" });
    }

    await Vote.deleteMany({ post: post._id });
    await SavedPost.deleteMany({ post: post._id });
    await Comment.deleteMany({ post: post._id });
    await Post.findByIdAndDelete(post._id);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ---------------------------------------------------------------------------
   ⭐ SAVE / UNSAVE
--------------------------------------------------------------------------- */
router.post('/:id/save', auth, validateObjectId('id'), async (req, res) => {
  await SavedPost.findOneAndUpdate(
    { user: req.user._id, post: req.params.id },
    {},
    { upsert: true }
  );
  res.json({ success: true, saved: true });
});

router.delete('/:id/save', auth, validateObjectId('id'), async (req, res) => {
  await SavedPost.findOneAndDelete({ user: req.user._id, post: req.params.id });
  res.json({ success: true, saved: false });
});

module.exports = router;
