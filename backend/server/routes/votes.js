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
      // created vote
    } else if (existing.value === direction) {
      // unvote
      await existing.deleteOne();
      newValue = 0;
    } else {
      // flip vote
      const delta = direction - existing.value; // e.g. 1 - (-1) = 2
      existing.value = direction;
      await existing.save();
    }

    // Recompute score from votes to ensure correctness
    const agg = await Vote.aggregate([
      { $match: { post: post._id } },
      { $group: { _id: '$post', score: { $sum: '$value' } } }
    ]);
    const newScore = (agg[0] && agg[0].score) || 0;
    post.score = newScore;
    await post.save();

    // return populated post
    const populated = await Post.findById(post._id).populate('author', 'username').populate('community', 'name title');
    res.json({ success: true, post: populated, yourVote: newValue });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/posts/:id/vote  -> remove any vote by user
router.delete('/:id/vote', auth, async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const existing = await Vote.findOne({ user: req.user._id, post: postId });
    if (existing) {
      await existing.deleteOne();
    }

    const agg = await Vote.aggregate([
      { $match: { post: post._id } },
      { $group: { _id: '$post', score: { $sum: '$value' } } }
    ]);
    const newScore = (agg[0] && agg[0].score) || 0;
    post.score = newScore;
    await post.save();

    const populated = await Post.findById(post._id).populate('author', 'username').populate('community', 'name title');
    res.json({ success: true, post: populated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
