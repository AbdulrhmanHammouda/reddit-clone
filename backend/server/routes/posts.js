const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const Vote = require("../models/Vote");
const { protect } = require("../middleware/authMiddleware");

// GET all posts
router.get("/", async (req, res) => {
  const posts = await Post.find()
    .populate("author", "username")
    .populate("community", "name");
  res.json(posts);
});

// CREATE a post (protected)
router.post("/", protect, async (req, res) => {
  const { title, body, community } = req.body;

  const post = await Post.create({
    title,
    body,
    community,
    author: req.user._id,
  });

  res.status(201).json(post);
});

// UPVOTE or DOWNVOTE
router.post("/:id/vote", protect, async (req, res) => {
  const { value } = req.body; // 1 or -1

  let vote = await Vote.findOne({
    user: req.user._id,
    post: req.params.id,
  });

  if (vote) {
    vote.value = value;
    await vote.save();
  } else {
    vote = await Vote.create({
      user: req.user._id,
      post: req.params.id,
      value,
    });
  }

  // Update post vote count
  const total = await Vote.aggregate([
    { $match: { post: vote.post } },
    { $group: { _id: "$post", votes: { $sum: "$value" } } },
  ]);

  await Post.findByIdAndUpdate(vote.post, {
    votes: total[0]?.votes || 0,
  });

  res.json({ success: true });
});

module.exports = router;
