
const express = require("express");
const router = express.Router();
const Comment = require("../models/Comment");
const Post = require("../models/Post");
const auth = require('../middleware/authMiddleware');


router.post("/", auth, async (req, res) => {
  try {
    const { postId, body, parent } = req.body;
    if (!postId || !body) return res.status(400).json({ error: "Missing fields" });
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const comment = await Comment.create({
      post: postId,
      author: req.user._id,
      body,
      parent: parent || null
    });

    await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });

    res.json(await comment.populate("author", "username"));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get("/post/:postId", async (req, res) => {
  try {
    const flat = await Comment.find({ post: req.params.postId })
      .sort({ createdAt: 1 })
      .populate("author", "username");

    // Build nested tree
    const byId = {};
    flat.forEach((c) => {
      const obj = {
        id: c._id,
        post: c.post,
        author: c.author,
        body: c.body,
        parent: c.parent,
        createdAt: c.createdAt,
        replies: []
      };
      byId[c._id] = obj;
    });

    const roots = [];
    Object.values(byId).forEach((c) => {
      if (c.parent) {
        const parent = byId[c.parent];
        if (parent) parent.replies.push(c);
      } else {
        roots.push(c);
      }
    });

    res.json(roots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
