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
const Notification = require('../models/Notification');
const optionalAuth = require("../middleware/optionalAuth");
const HiddenPost = require("../models/HiddenPost");

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

// POST /api/users/upload-banner
router.post('/upload-banner', auth, writeLimiter, upload.single('image'), async (req, res) => {
  try {
    if (!req.file || !req.file.path)
      return res.status(400).json({ success: false, data: null, error: 'No file uploaded' });

    const url = req.file.path;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { banner: url },
      { new: true }
    ).select('-passwordHash');

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        banner: user.banner,
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

// GET /api/users/me/settings → get user settings
router.get('/me/settings', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('settings email displayName bio avatar');
    
    // Return default settings if none exist
    const settings = user.settings || {
      allowFollowers: true,
      showOnlineStatus: true,
      allowDirectMessages: true,
      showInSearchResults: true,
      showNSFW: false,
      blurNSFW: true,
      autoplayMedia: true,
      reduceMotion: false,
      showRecommendations: true,
      emailNotifications: true,
      commentReplyNotifications: true,
      mentionNotifications: true,
      upvoteNotifications: false,
      newFollowerNotifications: true,
      chatMessageNotifications: true
    };

    res.status(200).json({
      success: true,
      data: {
        email: user.email,
        displayName: user.displayName,
        bio: user.bio,
        avatar: user.avatar,
        ...settings
      },
      error: null
    });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
});

// PATCH /api/users/me/settings → update user settings
router.patch('/me/settings', auth, writeLimiter, async (req, res) => {
  try {
    const allowedSettings = [
      'allowFollowers', 'showOnlineStatus', 'allowDirectMessages', 'showInSearchResults',
      'showNSFW', 'blurNSFW', 'autoplayMedia', 'reduceMotion', 'showRecommendations',
      'emailNotifications', 'commentReplyNotifications', 'mentionNotifications',
      'upvoteNotifications', 'newFollowerNotifications', 'chatMessageNotifications'
    ];
    
    const allowedProfile = ['displayName', 'bio'];
    
    const updates = {};
    const settingsUpdates = {};
    
    // Handle profile fields
    allowedProfile.forEach((k) => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });
    
    // Handle settings fields
    allowedSettings.forEach((k) => {
      if (req.body[k] !== undefined) settingsUpdates[`settings.${k}`] = req.body[k];
    });

    const allUpdates = { ...updates, ...settingsUpdates };
    
    if (Object.keys(allUpdates).length === 0) {
      return res.status(400).json({ success: false, data: null, error: 'No valid fields to update' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: allUpdates },
      { new: true }
    ).select('-passwordHash');

    res.status(200).json({ success: true, data: user, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
});

// POST /api/users/me/change-password → change password
const bcrypt = require('bcryptjs');

router.post('/me/change-password', auth, writeLimiter, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        data: null, 
        error: 'Current password and new password are required' 
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        data: null, 
        error: 'New password must be at least 6 characters' 
      });
    }
    
    // Get user with password hash
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, data: null, error: 'User not found' });
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        data: null, 
        error: 'Current password is incorrect' 
      });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);
    
    // Update password
    await User.findByIdAndUpdate(req.user._id, { passwordHash: newPasswordHash });
    
    res.status(200).json({ 
      success: true, 
      data: { message: 'Password changed successfully' }, 
      error: null 
    });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
});

// PATCH /api/users/me/email → update email
router.patch('/me/email', auth, writeLimiter, async (req, res) => {
  try {
    const { newEmail, password } = req.body;
    
    if (!newEmail || !password) {
      return res.status(400).json({ 
        success: false, 
        data: null, 
        error: 'New email and password are required' 
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({ 
        success: false, 
        data: null, 
        error: 'Invalid email format' 
      });
    }
    
    // Get user with password hash
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, data: null, error: 'User not found' });
    }
    
    // Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        data: null, 
        error: 'Password is incorrect' 
      });
    }
    
    // Check if email already exists
    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser && existingUser._id.toString() !== user._id.toString()) {
      return res.status(400).json({ 
        success: false, 
        data: null, 
        error: 'Email already in use' 
      });
    }
    
    // Update email
    await User.findByIdAndUpdate(req.user._id, { email: newEmail });
    
    res.status(200).json({ 
      success: true, 
      data: { email: newEmail, message: 'Email updated successfully' }, 
      error: null 
    });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
});

// DELETE /api/users/me/account → delete account
router.delete('/me/account', auth, writeLimiter, async (req, res) => {
  try {
    const { password, confirmText } = req.body;
    
    if (!password) {
      return res.status(400).json({ 
        success: false, 
        data: null, 
        error: 'Password is required to delete account' 
      });
    }
    
    if (confirmText !== 'DELETE') {
      return res.status(400).json({ 
        success: false, 
        data: null, 
        error: 'Please type DELETE to confirm account deletion' 
      });
    }
    
    // Get user with password hash
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, data: null, error: 'User not found' });
    }
    
    // Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        data: null, 
        error: 'Password is incorrect' 
      });
    }
    
    // Delete related data (cascade delete)
    const userId = req.user._id;
    
    // Delete user's posts
    await Post.deleteMany({ author: userId });
    
    // Delete user's comments
    await Comment.deleteMany({ author: userId });
    
    // Delete user's votes
    await Vote.deleteMany({ user: userId });
    await CommentVote.deleteMany({ user: userId });
    
    // Delete user's follows
    await Follow.deleteMany({ $or: [{ follower: userId }, { following: userId }] });
    
    // Delete user's saved posts
    await SavedPost.deleteMany({ user: userId });
    
    // Delete user's notifications
    await Notification.deleteMany({ $or: [{ user: userId }, { sourceUser: userId }] });
    
    // Delete user's community memberships
    await CommunityMember.deleteMany({ user: userId });
    
    // Delete user's hidden posts
    await HiddenPost.deleteMany({ user: userId });
    
    // Finally, delete the user
    await User.findByIdAndDelete(userId);
    
    res.status(200).json({ 
      success: true, 
      data: { message: 'Account deleted successfully' }, 
      error: null 
    });
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
      .select('username displayName bio avatar banner createdAt');

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
        allowFollowers: user.settings?.allowFollowers !== false,
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

    // Check if user allows followers
    if (userToFollow.settings?.allowFollowers === false) {
      return res.status(403).json({ 
        success: false, 
        error: "This user does not allow followers" 
      });
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

    // 🔔 Create notification only if user has enabled newFollowerNotifications
    if (userToFollow.settings?.newFollowerNotifications !== false) {
      await Notification.create({
        user: userToFollow._id,
        type: "follow",
        sourceUser: req.user._id,
      });
    }

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



// Utility to enrich posts with vote/save info
async function enrichPostsForUser(posts, viewerId) {
  if (!Array.isArray(posts)) return [];
  const results = [];
  for (const p of posts) {
    const postObj = p.toObject ? p.toObject() : p;
    let yourVote = 0;
    let saved = false;
    if (viewerId) {
      const v = await Vote.findOne({ user: viewerId, post: postObj._id });
      if (v) yourVote = v.value;
      const s = await SavedPost.findOne({ user: viewerId, post: postObj._id });
      if (s) saved = true;
    }
    results.push({ ...postObj, yourVote, saved });
  }
  return results;
}

// GET /api/users/:username/posts
router.get("/:username/posts", optionalAuth, async (req, res) => {
  try {
    const { username } = req.params;
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    const posts = await Post.find({ author: user._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("author", "username avatar")
      .populate("community", "name title icon isMember isMod");

    const data = await enrichPostsForUser(posts, req.user?._id);

    res.json({ success: true, data: { posts: data } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/users/:username/comments (paginated)
router.get("/:username/comments", optionalAuth, async (req, res) => {
  try {
    const { username } = req.params;
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    const comments = await Comment.find({ author: user._id })
      .populate("author", "username avatar")
      .populate({ path: "post", select: "title community", populate: { path: "community", select: "name title icon" } })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const commentsWithVotes = await Promise.all(
      comments.map(async (comment) => {
        let yourVote = 0;
        if (req.user?._id) {
          const vote = await CommentVote.findOne({ user: req.user._id, comment: comment._id });
          if (vote) yourVote = vote.value;
        }
        return { ...comment.toObject(), yourVote };
      })
    );

    res.json({ success: true, data: { comments: commentsWithVotes } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/users/:username/saved
router.get("/:username/saved", auth, async (req, res) => {
  try {
    const { username } = req.params;
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    // saved posts are private; only owner can view
    if (req.user?.username !== username && req.user?.name !== username) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    const saved = await SavedPost.find({ user: user._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({
        path: "post",
        populate: [
          { path: "author", select: "username avatar" },
          { path: "community", select: "name title icon" },
        ],
      });

    const posts = saved.map((s) => s.post).filter(Boolean);
    const data = await enrichPostsForUser(posts, req.user?._id);
    res.json({ success: true, data: { posts: data } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/users/:username/history (stub / placeholder)
router.get("/:username/history", auth, async (req, res) => {
  // If you track history, plug it here. For now, return empty list to satisfy UI.
  return res.json({ success: true, data: { posts: [] } });
});

// GET /api/users/:username/hidden (stub / placeholder)
router.get("/:username/hidden", auth, async (req, res) => {
  try {
    const { username } = req.params;
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);

    // hidden is private; only owner
    if (req.user?.username !== username && req.user?.name !== username) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    const hidden = await HiddenPost.find({ user: user._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({
        path: "post",
        populate: [
          { path: "author", select: "username avatar" },
          { path: "community", select: "name title icon" },
        ],
      });

    const posts = hidden.map((h) => h.post).filter(Boolean);
    const data = await enrichPostsForUser(posts, req.user?._id);
    return res.json({ success: true, data: { posts: data } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/users/:username/votes?type=up|down
router.get("/:username/votes", optionalAuth, async (req, res) => {
  try {
    const { username } = req.params;
    const type = req.query.type === "down" ? -1 : 1;
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    const votes = await Vote.find({ user: user._id, value: type })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({
        path: "post",
        populate: [
          { path: "author", select: "username avatar" },
          { path: "community", select: "name title icon" },
        ],
      });

    const posts = votes.map((v) => v.post).filter(Boolean);
    const data = await enrichPostsForUser(posts, req.user?._id);
    res.json({ success: true, data: { posts: data } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});



module.exports = router;
