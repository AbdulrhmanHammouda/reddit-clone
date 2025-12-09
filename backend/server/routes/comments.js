const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const validateObjectId = require("../middleware/validateObjectId");
const Comment = require("../models/Comment");
const Post = require("../models/Post");
const CommentVote = require("../models/CommentVote");
const auth = require("../middleware/authMiddleware");
const { writeLimiter } = require("../middleware/rateLimiter");

// Multer + Cloudinary
const multer = require("multer");
const { storage } = require("../utils/cloudinary");
const upload = multer({ storage });

/* ---------------------------------------------------------------------------
   🔺🔻 VOTE COMMENT
--------------------------------------------------------------------------- */
router.post("/:id/vote", auth, validateObjectId("id"), async (req, res) => {
  try {
    const value = Number(req.body.value);
    if (![1, -1, 0].includes(value)) {
      return res.status(400).json({ success: false, error: "Invalid vote" });
    }

    const commentId = req.params.id;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment)
      return res.status(404).json({ success: false, error: "Comment not found" });

    let existing = await CommentVote.findOne({ user: userId, comment: commentId });

    if (!existing) {
      if (value !== 0) {
        await CommentVote.create({ user: userId, comment: commentId, value });
        comment.score += value;
      }
    } else if (value === 0) {
      comment.score -= existing.value;
      await existing.deleteOne();
    } else if (existing.value !== value) {
      comment.score += value * 2;
      existing.value = value;
      await existing.save();
    } else {
      comment.score -= existing.value;
      await existing.deleteOne();
    }

    await comment.save();

    const updated = await CommentVote.findOne({ user: userId, comment: commentId });
    const yourVote = updated ? updated.value : 0;

    res.json({ success: true, data: { score: comment.score, yourVote } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ---------------------------------------------------------------------------
   📌 CREATE COMMENT + IMAGES
--------------------------------------------------------------------------- */
router.post("/", auth, writeLimiter, upload.array("images", 10), async (req, res) => {
  try {
    const { postId, body, parent } = req.body;
    if (!postId || !mongoose.isValidObjectId(postId)) {
      return res.status(400).json({ success: false, error: "Invalid postId" });
    }
    if (!body) {
      return res.status(400).json({ success: false, error: "Missing body" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }

    const imageUrls = req.files?.map(f => f.path) || [];

    const comment = await Comment.create({
      post: postId,
      author: req.user._id,
      body,
      parent: parent || null,
      images: imageUrls,
    });

    await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });

    const populated = await comment.populate("author", "username avatar");

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ---------------------------------------------------------------------------
   📌 GET POST COMMENTS (nested)
--------------------------------------------------------------------------- */
/* ---------------------------------------------------------------------------
   📌 GET ALL COMMENTS FOR A POST (full tree + avatar + votes)
--------------------------------------------------------------------------- */
router.get("/post/:postId", validateObjectId("postId"), auth, async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user._id;

    // Fetch all comments sorted by oldest → newest
    const flat = await Comment.find({ post: postId })
      .sort({ createdAt: 1 })
      .populate("author", "username avatar")
      .lean();

    // Attach vote for current user
    const ids = flat.map(c => c._id);
    const votes = await CommentVote.find({ user: userId, comment: { $in: ids } }).lean();
    const mapVotes = new Map(votes.map(v => [v.comment.toString(), v.value]));

    flat.forEach(c => {
      c.id = c._id;
      c.replies = [];
      c.yourVote = mapVotes.get(c._id.toString()) || 0;
    });

    // Build nested structure
    const byId = {};
    flat.forEach(c => (byId[c._id] = c));

    const roots = [];
    flat.forEach(c => {
      if (c.parent && byId[c.parent]) {
        byId[c.parent].replies.push(c);
      } else {
        roots.push(c);
      }
    });

    res.json({ success: true, data: roots });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


/* ---------------------------------------------------------------------------
   ✏️ EDIT COMMENT
--------------------------------------------------------------------------- */
router.patch("/:id", auth, writeLimiter, validateObjectId("id"), async (req, res) => {
  try {
    const { id: commentId } = req.params;
    const userId = req.user._id;

    const updates = {};
    if (req.body.body) updates.body = req.body.body;

    const comment = await Comment.findOneAndUpdate(
      { _id: commentId, author: userId },
      { $set: updates },
      { new: true }
    ).populate("author", "username avatar");

    if (!comment) {
      return res.status(403).json({ success: false, error: "Not authorized" });
    }

    res.json({ success: true, data: comment });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ---------------------------------------------------------------------------
   🗑 DELETE COMMENT
--------------------------------------------------------------------------- */
router.delete("/:id", auth, writeLimiter, validateObjectId("id"), async (req, res) => {
  try {
    const comment = await Comment.findOne({ _id: req.params.id, author: req.user._id });
    if (!comment) {
      return res.status(403).json({ success: false, error: "Not authorized" });
    }

    await CommentVote.deleteMany({ comment: comment._id });
    await Post.findByIdAndUpdate(comment.post, { $inc: { commentsCount: -1 } });
    await comment.deleteOne();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
