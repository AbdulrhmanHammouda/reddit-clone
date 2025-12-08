// routes/votes.js
const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Vote = require('../models/Vote');
const auth = require('../middleware/authMiddleware');
const { writeLimiter } = require('../middleware/rateLimiter');
const validateObjectId = require('../middleware/validateObjectId');

// POST /api/posts/:id/vote
router.post('/:id/vote', auth, writeLimiter, validateObjectId('id'), async (req, res) => {
  try {
    const { direction } = req.body; // 1, -1, 0
    const postId = req.params.id;

    if (![1, -1, 0].includes(direction))
      return res.status(400).json({ success: false, error: "Invalid direction" });

    const post = await Post.findById(postId);
    if (!post)
      return res.status(404).json({ success: false, error: "Post not found" });

    const existing = await Vote.findOne({ user: req.user._id, post: postId });

    if (!existing) {
      if (direction !== 0)
        await Vote.create({ user: req.user._id, post: postId, direction });
    } else if (direction === 0) {
      await existing.deleteOne();
    } else {
      existing.direction = direction;
      await existing.save();
    }

    const agg = await Vote.aggregate([
      { $match: { post: post._id } },
      { $group: { _id: '$post', score: { $sum: '$direction' } } }
    ]);

    const newScore = (agg[0]?.score) || 0;
    post.score = newScore;
    await post.save();

    const updatedVote = await Vote.findOne({ user: req.user._id, post: post._id });
    const yourVote = updatedVote ? updatedVote.direction : 0;

    res.json({
      success: true,
      data: { score: newScore, yourVote }
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
