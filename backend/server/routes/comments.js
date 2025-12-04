
const express = require("express");
const router = express.Router();
const Comment = require("../models/Comment");
const Post = require("../models/post");
const auth = require('../midddleware/authMiddleware');


router.post("/", auth, async (req, res) => {
  try {
    const { postId, body, parent } = req.body;
    if (!postId || !body) return res.status(400).json({ message: "Missing fields" });
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = await Comment.create({
      post: postId,
      author: req.user._id,
      body,
      parent: parent || null
    });

    await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });

    res.json(await comment.populate("author", "username"));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.get("/post/:postId", async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .sort({ createdAt: 1 })
      .populate("author", "username");
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
