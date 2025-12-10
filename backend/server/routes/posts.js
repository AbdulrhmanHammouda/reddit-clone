// backend/routes/posts.js
const express = require('express');
const router = express.Router();

const validateObjectId = require('../middleware/validateObjectId');
const auth = require('../middleware/authMiddleware');
const optionalAuth = require('../middleware/optionalAuth');
const { writeLimiter } = require('../middleware/rateLimiter');

const Community = require('../models/Community');
const CommunityMember = require('../models/CommunityMember');
const Post = require('../models/Post');
const Vote = require('../models/Vote');
const Comment = require('../models/Comment');
const SavedPost = require('../models/SavedPost');
const HiddenPost = require('../models/HiddenPost');
const mongoose = require('mongoose');

const multer = require('multer');
const { storage } = require('../utils/cloudinary');
const upload = multer({ storage });

function timeWindowMatch(time) {
  const msMap = {
    hour: 3600000,
    day: 86400000,
    week: 7 * 86400000,
    month: 30 * 86400000,
    year: 365 * 86400000,
  };
  if (!time || time === "all") return {};
  const ms = msMap[time] || msMap.month;
  return { createdAt: { $gte: new Date(Date.now() - ms) } };
}

// Video upload (mp4, webm only)
const videoUpload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ["video/mp4", "video/webm"];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    return cb(new Error("Invalid video format. Only mp4 and webm are allowed."));
  },
});

/* ---------------------------------------------------------------------------
   📌 CREATE IMAGE / VIDEO POST
--------------------------------------------------------------------------- */
router.post('/image', auth, writeLimiter, upload.array('images', 10), async (req, res) => {
  try {
    const { title, body, communityName } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: "No files uploaded" });
    }

    const community = await Community.findOne({ name: communityName });
    if (!community) {
      return res.status(404).json({ success: false, error: "Community not found" });
    }

    const imageUrls = req.files.map(file => file.path);

    const post = await Post.create({
      title,
      body: body || "",
      author: req.user._id,
      community: community._id,
      images: imageUrls // Save array of image URLs
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
   📥 FEED WITH SORTING (best | hot | new | top | rising)
   - Optimized: Uses $lookup for isMember/yourVote/saved (no N+1 queries)
   - Excludes user's own posts
--------------------------------------------------------------------------- */
router.get('/', optionalAuth, async (req, res) => {
  console.time("home-feed");
  try {
    const VALID_SORTS = ["best", "hot", "new", "top", "rising"];
    const rawSort = (req.query.sort || "best").toLowerCase();
    const sort = VALID_SORTS.includes(rawSort) ? rawSort : "best";
    const time = (req.query.time || "all").toLowerCase();
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const userId = req.user?._id;

    // Base match with time window for "top" sort
    const match = { ...timeWindowMatch(sort === "top" ? time : "all") };

    // Exclude own posts on home feed
    if (userId) {
      match.author = { $ne: userId };
    }

    // Build sort stages
    const now = new Date();
    const ageHoursExpr = {
      $divide: [{ $subtract: [now, "$createdAt"] }, 1000 * 3600],
    };

    const pipeline = [{ $match: match }];

    if (sort === "hot") {
      pipeline.push({
        $addFields: {
          ageHours: ageHoursExpr,
          hotScore: {
            $divide: ["$score", { $pow: [{ $add: ["$ageHours", 2] }, 1.5] }],
          },
        },
      });
      pipeline.push({ $sort: { hotScore: -1 } });
    } else if (sort === "new") {
      pipeline.push({ $sort: { createdAt: -1 } });
    } else if (sort === "top") {
      pipeline.push({ $sort: { score: -1, createdAt: -1 } });
    } else if (sort === "rising") {
      pipeline.push({
        $addFields: {
          ageHours: ageHoursExpr,
          risingScore: {
            $cond: [
              { $lte: ["$ageHours", 0.1] },
              "$score",
              { $divide: ["$score", { $sqrt: { $add: ["$ageHours", 1] } }] },
            ],
          },
        },
      });
      pipeline.push({ $sort: { risingScore: -1 } });
    } else {
      // best (default)
      pipeline.push({
        $addFields: {
          ageHours: ageHoursExpr,
          bestScore: {
            $add: ["$score", { $divide: ["$score", { $add: ["$ageHours", 10] }] }],
          },
        },
      });
      pipeline.push({ $sort: { bestScore: -1, createdAt: -1 } });
    }

    pipeline.push({ $skip: skip }, { $limit: limit });

    // $lookup for author
    pipeline.push({
      $lookup: {
        from: "users",
        localField: "author",
        foreignField: "_id",
        as: "authorData",
      },
    });
    pipeline.push({
      $addFields: {
        author: {
          $let: {
            vars: { a: { $arrayElemAt: ["$authorData", 0] } },
            in: { _id: "$$a._id", username: "$$a.username", avatar: "$$a.avatar" },
          },
        },
      },
    });
    pipeline.push({ $unset: "authorData" });

    // $lookup for community
    pipeline.push({
      $lookup: {
        from: "communities",
        localField: "community",
        foreignField: "_id",
        as: "communityData",
      },
    });

    // $lookup for isMember (only if logged in)
    if (userId) {
      pipeline.push({
        $lookup: {
          from: "communitymembers",
          let: { communityId: "$community" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$community", "$$communityId"] },
                    { $eq: ["$user", userId] },
                  ],
                },
              },
            },
          ],
          as: "membership",
        },
      });

      // $lookup for yourVote
      pipeline.push({
        $lookup: {
          from: "votes",
          let: { postId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$post", "$$postId"] },
                    { $eq: ["$user", userId] },
                  ],
                },
              },
            },
          ],
          as: "voteData",
        },
      });

      // $lookup for saved
      pipeline.push({
        $lookup: {
          from: "savedposts",
          let: { postId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$post", "$$postId"] },
                    { $eq: ["$user", userId] },
                  ],
                },
              },
            },
          ],
          as: "savedData",
        },
      });

      pipeline.push({
        $addFields: {
          community: {
            $let: {
              vars: { c: { $arrayElemAt: ["$communityData", 0] } },
              in: {
                _id: "$$c._id",
                name: "$$c.name",
                title: "$$c.title",
                icon: "$$c.icon",
                isMember: { $gt: [{ $size: "$membership" }, 0] },
              },
            },
          },
          yourVote: {
            $ifNull: [{ $arrayElemAt: ["$voteData.value", 0] }, 0],
          },
          saved: { $gt: [{ $size: "$savedData" }, 0] },
        },
      });

      pipeline.push({ $unset: ["communityData", "membership", "voteData", "savedData"] });
    } else {
      // Not logged in - no membership/vote/saved lookups needed
      pipeline.push({
        $addFields: {
          community: {
            $let: {
              vars: { c: { $arrayElemAt: ["$communityData", 0] } },
              in: {
                _id: "$$c._id",
                name: "$$c.name",
                title: "$$c.title",
                icon: "$$c.icon",
                isMember: false,
              },
            },
          },
          yourVote: 0,
          saved: false,
        },
      });
      pipeline.push({ $unset: "communityData" });
    }

    // Clean up computed fields
    pipeline.push({ $unset: ["ageHours", "hotScore", "bestScore", "risingScore"] });

    const posts = await Post.aggregate(pipeline);
    const total = await Post.countDocuments(match);

    console.timeEnd("home-feed");

    res.json({
      success: true,
      data: {
        posts,
        page,
        limit,
        total,
      },
    });
  } catch (err) {
    console.timeEnd("home-feed");
    console.error("GET /api/posts error", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ---------------------------------------------------------------------------
   🎥 LEGACY CREATE VIDEO POST (kept for compatibility)
--------------------------------------------------------------------------- */
router.post('/video', auth, writeLimiter, videoUpload.single('video'), async (req, res) => {
  try {
    const { title, body, communityName } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, error: "No video uploaded" });
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
      videoUrl: req.file.path,
      images: [],
      processing: false,
    });

    const populated = await Post.findById(post._id)
      .populate('author', 'username avatar')
      .populate('community', 'name title icon');

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    const message = err.message || "Upload failed";
    if (message.includes("Invalid video format")) {
      return res.status(400).json({ success: false, error: message });
    }
    res.status(500).json({ success: false, error: message });
  }
});

/* ---------------------------------------------------------------------------
   🎥 ASYNC VIDEO UPLOAD STEP
--------------------------------------------------------------------------- */
router.post('/:id/videoUpload', auth, writeLimiter, validateObjectId('id'), videoUpload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No video uploaded" });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }

    if (String(post.author) !== String(req.user._id)) {
      return res.status(403).json({ success: false, error: "Not owner of post" });
    }

    post.videoUrl = req.file.path;
    post.processing = false;
    post.images = [];
    await post.save();

    const populated = await Post.findById(post._id)
      .populate('author', 'username avatar')
      .populate('community', 'name title icon');

    res.status(200).json({ success: true, data: populated });
  } catch (err) {
    const message = err.message || "Upload failed";
    if (message.includes("Invalid video format")) {
      return res.status(400).json({ success: false, error: message });
    }
    res.status(500).json({ success: false, error: message });
  }
});

/* ---------------------------------------------------------------------------
   📌 CREATE TEXT/LINK POST
--------------------------------------------------------------------------- */
router.post('/', auth, writeLimiter, async (req, res) => {
  try {
    const { title, body, communityName, url, isVideo } = req.body;

    const community = await Community.findOne({ name: communityName });
    if (!community) {
      return res.status(404).json({ success: false, error: "Community not found" });
    }

    const base = {
      title,
      body: body || "",
      author: req.user._id,
      community: community._id,
      url: url || null
    };

    if (isVideo === true || isVideo === "true") {
      base.videoUrl = null;
      base.processing = true;
    }

    const post = await Post.create(base);

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
router.get('/:id', optionalAuth, validateObjectId('id'), async (req, res) => {
    try {
      const post = await Post.findById(req.params.id)
        .populate('author', 'username avatar')
        .populate('community', 'name title icon')
        .lean(); // Use lean for better performance and to attach properties
  
      if (!post) {
        return res.status(404).json({ success: false, error: 'Post not found' });
      }
  
      // Initialize all flags
      let yourVote = 0;
      let saved = false;
      let isMember = false;
      let isMod = false;
  
      // Check flags only if user is logged in
      if (req.user) {
        const userId = req.user._id;
  
        // Check for vote
        const vote = await Vote.findOne({ user: userId, post: post._id }).lean();
        if (vote) yourVote = vote.value;
  
        // Check if saved
        const isSaved = await SavedPost.exists({ user: userId, post: post._id });
        if (isSaved) saved = true;
  
        // Check for community membership and role
        if (post.community) {
          const membership = await CommunityMember.findOne({
            user: userId,
            community: post.community._id,
          }).lean();
  
          if (membership) {
            isMember = true;
            if (['moderator', 'owner'].includes(membership.role)) {
              isMod = true;
            }
          }
        }
      }
  
      res.status(200).json({
        success: true,
        data: {
          ...post,
          yourVote,
          saved,
          community: post.community ? { ...post.community, isMember, isMod } : null,
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

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
      const post = await Post.findById(req.params.id);
      if (!post) {
        // Already gone, success.
        return res.json({ success: true });
      }
  
      const userId = req.user._id;
      let isMod = false;
  
      // Check if user is a mod of the community
      if (post.community) {
        const membership = await CommunityMember.findOne({
          user: userId,
          community: post.community,
        });
        if (membership && ['moderator', 'owner'].includes(membership.role)) {
          isMod = true;
        }
      }
  
      // Author or mod can delete
      if (post.author.toString() !== userId.toString() && !isMod) {
        return res.status(403).json({ success: false, error: "Not authorized to delete this post" });
      }
  
      // Proceed with deletion
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

/* ---------------------------------------------------------------------------
   🙈 HIDE / UNHIDE
--------------------------------------------------------------------------- */
router.post('/:id/hide', auth, validateObjectId('id'), async (req, res) => {
  await HiddenPost.findOneAndUpdate(
    { user: req.user._id, post: req.params.id },
    {},
    { upsert: true }
  );
  res.json({ success: true, hidden: true });
});

router.delete('/:id/hide', auth, validateObjectId('id'), async (req, res) => {
  await HiddenPost.findOneAndDelete({ user: req.user._id, post: req.params.id });
  res.json({ success: true, hidden: false });
});

module.exports = router;
