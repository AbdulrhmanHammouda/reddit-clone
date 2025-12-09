const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { writeLimiter } = require('../middleware/rateLimiter');
const multer = require('multer');
const { storage } = require('../utils/cloudinary');
const User = require('../models/User');
const CommunityMember = require('../models/CommunityMember');
const SavedPost = require('../models/SavedPost');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Vote = require('../models/Vote');
const CommentVote = require('../models/CommentVote');
const Follow = require('../models/Follow'); 

// Multer config for avatar uploads
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Invalid file type'));
    }
    cb(null, true);
  },
});

// POST /api/users/upload-avatar
router.post('/upload-avatar', auth, writeLimiter, upload.single('image'), async (req, res) => {
  try {
    if (!req.file || !req.file.path)
      return res.status(400).json({ success: false, data: null, error: 'No file uploaded' });

    const url = req.file.path;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: url },
      { new: true }
    ).select('-passwordHash');

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      },
      error: null,
    });

  } catch (err) {
    if (err?.code === 'LIMIT_FILE_SIZE')
      return res.status(400).json({ success: false, data: null, error: 'File too large (max 5MB)' });

    if (err?.message === 'Invalid file type')
      return res.status(400).json({ success: false, data: null, error: 'Invalid file type' });

    res.status(500).json({ success: false, data: null, error: err.message });
  }
});

// GET /api/users/me → logged-in user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-passwordHash -email');

    res.status(200).json({ success: true, data: user, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
});

// PATCH /api/users/me → update profile info
router.patch('/me', auth, writeLimiter, async (req, res) => {
  try {
    const updates = {};
    const allowed = ['bio', 'avatar', 'displayName'];
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true })
      .select('-passwordHash -email');

    res.status(200).json({ success: true, data: user, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
});




// GET /api/users/me/saved → saved posts
router.get('/me/saved', auth, async (req, res) => {
  try {
    const saved = await SavedPost.find({ user: req.user._id })
      .populate({
        path: 'post',
        populate: [
          { path: 'author', select: 'username avatar' }, // Include avatar for author
          { path: 'community', select: 'name title icon' }, // Include icon for community
        ],
        select: 'title content image score createdAt', // Select image and other relevant post fields
      });

    const postsWithDetails = await Promise.all(saved.map(async (s) => {
      const post = s.post.toObject();

      // Calculate score (already available from post.score, but ensure consistency)
      const score = post.score || 0;

      let yourVote = 0;
      if (req.user) {
        const v = await Vote.findOne({ user: req.user._id, post: post._id });
        if (v) yourVote = v.value;
      }

      return {
        ...post,
        score,
        yourVote,
        saved: true, // Always true for posts returned from /me/saved
      };
    }));

    res.status(200).json({
      success: true,
      data: postsWithDetails,
      error: null,
    });

  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
});

// 🔥 FULL PUBLIC PROFILE ENDPOINT 🔥
// GET /api/users/:username
router.get('/:username', auth, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('username displayName bio avatar createdAt');

    if (!user) {
      return res.status(404).json({
        success: false,
        data: null,
        error: 'User not found'
      });
    }

    const userId = user._id;

    // Followers & Following Count
    const followersCount = await Follow.countDocuments({ following: userId });
    const followingCount = await Follow.countDocuments({ follower: userId });

    // 🔥 Check if logged-in user follows this profile
    let isFollowing = false;
    if (req.user) {
      const exists = await Follow.findOne({
        follower: req.user._id,
        following: userId,
      });
      isFollowing = !!exists;
    }

    // Posts Count + Post Karma
    const postsExist = await Post.find({ author: userId }).select('_id');
    const postIds = postsExist.map(p => p._id);

    const postKarmaAgg = await Vote.aggregate([
      { $match: { post: { $in: postIds } } },
      { $group: { _id: null, total: { $sum: '$value' } } },
    ]);
    const postKarma = postKarmaAgg[0]?.total || 0;

    // Comments + Comment Karma
    const commentCount = await Comment.countDocuments({ author: userId });

    const commentKarmaAgg = await CommentVote.aggregate([
      { $match: { user: userId } },
      { $group: { _id: null, total: { $sum: '$value' } } },
    ]);
    const commentKarma = commentKarmaAgg[0]?.total || 0;

    // Karma Total
    const karma = postKarma + commentKarma;

    // Contributions = posts + comments
    const contributions = postsExist.length + commentCount;

    // Moderator Communities
    const moderatedMemberships = await CommunityMember.find({
      user: userId,
      role: 'moderator',
    }).populate('community', 'name title membersCount');

    const moderatedCommunities = moderatedMemberships.map(m => m.community);

    // Fetch Actual Posts With Details
    const recentPosts = await Post.find({ author: userId })
      .populate('author', 'username')
      .populate('community', 'name title')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        ...user.toObject(),
        followersCount,
        followingCount,
        isFollowing, 
        karma,
        contributions,
        commentCount,
        postCount: postsExist.length,
        posts: recentPosts,
        moderatedCommunities,
        createdAt: user.createdAt,
      },
      error: null
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      data: null,
      error: err.message
    });
  }
});

// FOLLOW a user ➜ POST /api/users/:username/follow
router.post('/:username/follow', auth, async (req, res) => {
  try {
    const userToFollow = await User.findOne({ username: req.params.username });
    if (!userToFollow) return res.status(404).json({ error: "User not found" });

    if (userToFollow._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: "You can't follow yourself" });
    }

    const existing = await Follow.findOne({ 
      follower: req.user._id, 
      following: userToFollow._id 
    });

    if (existing) {
      return res.status(200).json({ success: true, following: true });
    }

    await Follow.create({
      follower: req.user._id,
      following: userToFollow._id
    });

    res.json({ success: true, following: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UNFOLLOW a user ➜ DELETE /api/users/:username/follow
router.delete('/:username/follow', auth, async (req, res) => {
  try {
    const userToUnfollow = await User.findOne({ username: req.params.username });
    if (!userToUnfollow) return res.status(404).json({ error: "User not found" });

    await Follow.deleteOne({
      follower: req.user._id,
      following: userToUnfollow._id
    });

    res.json({ success: true, following: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


 

// GET /api/users/me/communities → communities I own / moderate
router.get("/me/communities", auth, async (req, res) => {
  try {
    const membership = await CommunityMember.find({
      user: req.user._id,
      role: { $in: ["owner", "moderator"] },     // only owner / mod
    }).populate("community", "name title icon membersCount");

    const data = membership
      .map((m) =>
        m.community && {
          _id: m.community._id.toString(),
          name: m.community.name,
          title: m.community.title,
          icon: m.community.icon,
          membersCount: m.community.membersCount,
          role: m.role,                           // 🔥 IMPORTANT
        }
      )
      .filter(Boolean);

    res.status(200).json({
      success: true,
      data,
      error: null,
    });
  } catch (err) {
    console.error("GET /users/me/communities error:", err);
    res.status(500).json({ success: false, data: null, error: err.message });
  }
});





// GET /api/users/:username/comments → fetch comments by a user
router.get('/:username/comments', auth, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ success: false, data: null, error: 'User not found' });
    }

    const comments = await Comment.find({ author: user._id })
      .populate('author', 'username avatar')
      .populate({
        path: 'post',
        select: 'title community',
        populate: { path: 'community', select: 'name title icon' },
      })
      .sort({ createdAt: -1 });

    const commentsWithDetails = await Promise.all(
      comments.map(async (comment) => {
        let yourVote = 0;
        if (req.user) {
          const vote = await CommentVote.findOne({
            user: req.user._id,
            comment: comment._id,
          });
          if (vote) yourVote = vote.value;
        }

        return {
          ...comment.toObject(),
          yourVote,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: commentsWithDetails,
      error: null,
    });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
});


module.exports = router;
