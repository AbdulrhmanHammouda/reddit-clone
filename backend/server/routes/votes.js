const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Vote = require('../models/Vote');
const auth = require('../middleware/authMiddleware');

// POST /api/posts/:id/vote
router.post('/:id/vote', auth, async (req, res) => {
  try {
    const postId = req.params.id;
    const { direction } = req.body; // expected 1 or -1
    if (![1, -1].includes(direction)) return res.status(400).json({ error: 'Invalid direction' });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const existing = await Vote.findOne({ user: req.user._id, post: postId });
    let newValue = direction;
    if (!existing) {
      await Vote.create({ user: req.user._id, post: postId, value: direction });
      post.score = (post.score || 0) + direction;
    } else if (existing.value === direction) {
      // unvote
      await existing.deleteOne();
      post.score = (post.score || 0) - direction;
      newValue = 0;
    } else {
      // flip vote
      const delta = direction - existing.value; // e.g. 1 - (-1) = 2
      existing.value = direction;
      await existing.save();
      post.score = (post.score || 0) + delta;
    }

    await post.save();

    res.json({ success: true, score: post.score, yourVote: newValue });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
