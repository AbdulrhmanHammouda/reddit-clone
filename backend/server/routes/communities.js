// backend/routes/communities.js
const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const Community = require("../models/Community");
const CommunityMember = require("../models/CommunityMember");
const Post = require("../models/Post");
const Vote = require("../models/Vote");

const auth = require("../middleware/authMiddleware");
const optionalAuth = require("../middleware/optionalAuth");
const { writeLimiter } = require("../middleware/rateLimiter");

// 🛠 Utility to normalize community name
function normalizeName(name) {
  return (name || "").toLowerCase();
}

// 🚀 Create Community (Owner)
router.post("/", auth, writeLimiter, async (req, res) => {
  try {
    const { name, title, description, isPrivate, rules } = req.body;

    if (!name || !title) {
      return res.status(400).json({ success: false, error: "Missing fields" });
    }

    const finalName = normalizeName(name);
    const exists = await Community.findOne({ name: finalName });
    if (exists) {
      return res
        .status(400)
        .json({ success: false, error: "Community already exists" });
    }

    const community = await Community.create({
      name: finalName,
      title,
      description,
      createdBy: req.user._id,
      isPrivate: !!isPrivate,
      rules: rules || [],
      membersCount: 1,
    });

    await CommunityMember.create({
      user: req.user._id,
      community: community._id,
      role: "owner",
    });

    res.status(201).json({ success: true, data: community });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 🧭 Get Community Basic Details
router.get("/:name", optionalAuth, async (req, res) => {
  try {
    const finalName = normalizeName(req.params.name);
    const community = await Community.findOne({ name: finalName });
    if (!community) {
      return res
        .status(404)
        .json({ success: false, data: null, error: "Community not found" });
    }

    let isOwner = false;
    let isMember = false;
    let memberRole = null;

    if (req.user) {
      const userId = req.user.id || req.user._id;
      const createdById = community.createdBy?.toString?.();

      if (userId && createdById && createdById === userId.toString()) {
        isOwner = true;
        isMember = true;
        memberRole = "owner";
      } else {
        const m = await CommunityMember.findOne({
          user: userId,
          community: community._id,
        });
        if (m) {
          isMember = true;
          memberRole = m.role;
        }
      }
    }

    res.json({
      success: true,
      data: {
        ...community.toObject(),
        isOwner,
        isMember,
        memberRole,
      },
      error: null,
    });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
});

// 🧭 Popular Communities List
router.get("/", async (req, res) => {
  try {
    const list = await Community.find()
      .sort({ membersCount: -1 })
      .limit(50)
      .select("name title description membersCount icon");

    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ➕ Join Community
router.post("/:name/join", auth, writeLimiter, async (req, res) => {
  try {
    const finalName = normalizeName(req.params.name);
    const community = await Community.findOne({ name: finalName });
    if (!community) {
      return res
        .status(404)
        .json({ success: false, error: "Community not found" });
    }

    const userId = req.user._id;

    // Owner cannot "join"
    if (community.createdBy.toString() === userId.toString()) {
      return res.json({
        success: true,
        joined: true,
        membersCount: community.membersCount,
      });
    }

    const existing = await CommunityMember.findOne({
      user: userId,
      community: community._id,
    });

    if (!existing) {
      await CommunityMember.create({
        user: userId,
        community: community._id,
        role: "member",
      });

      community.membersCount++;
      await community.save();
    }

    res.json({
      success: true,
      joined: true,
      membersCount: community.membersCount,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ➖ Leave Community
router.post("/:name/leave", auth, writeLimiter, async (req, res) => {
  try {
    const finalName = normalizeName(req.params.name);
    const community = await Community.findOne({ name: finalName });
    if (!community) {
      return res
        .status(404)
        .json({ success: false, error: "Community not found" });
    }

    const userId = req.user._id;

    // Owner cannot leave their own community
    if (community.createdBy.toString() === userId.toString()) {
      return res.json({
        success: true,
        joined: true,
        membersCount: community.membersCount,
      });
    }

    const del = await CommunityMember.findOneAndDelete({
      user: userId,
      community: community._id,
    });

    if (del) {
      community.membersCount--;
      await community.save();
    }

    res.json({
      success: true,
      joined: false,
      membersCount: community.membersCount,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 📝 Get Community + Posts (with owner/join info + voting info)
router.get("/:name/posts", optionalAuth, async (req, res) => {
  try {
    const finalName = normalizeName(req.params.name);
    const community = await Community.findOne({ name: finalName });
    if (!community) {
      return res.status(404).json({
        success: false,
        data: null,
        error: "Community not found",
      });
    }

    let isMember = false;
    let memberRole = null;
    let isOwner = false;
    let userId = req.user?.id || req.user?._id || null;

    if (userId) {
      const createdById = community.createdBy?.toString?.();
      if (createdById === userId.toString()) {
        isOwner = true;
        isMember = true;
        memberRole = "owner";
      } else {
        const membership = await CommunityMember.findOne({
          user: userId,
          community: community._id,
        });
        if (membership) {
          isMember = true;
          memberRole = membership.role;
        }
      }
    }

    // Fetch posts
    const posts = await Post.find({ community: community._id })
      .sort({ createdAt: -1 })
      .populate("author", "username avatar")
      .populate("community", "name title icon");


    // Attach score + yourVote to each post (✔ fixed vote field)
    const postsWithVotes = await Promise.all(
      posts.map(async (post) => {
        const scoreAgg = await Vote.aggregate([
          { $match: { post: post._id } },
          { $group: { _id: "$post", score: { $sum: "$value" } } }, // 🔥 FIXED
        ]);

        const score = scoreAgg[0]?.score || 0;

        let yourVote = 0;
        if (userId) {
          const v = await Vote.findOne({ user: userId, post: post._id });
          if (v) yourVote = v.value; // 🔥 FIXED
        }

        return {
          ...post.toObject(),
          score,
          yourVote,
        };
      })
    );

    res.json({
      success: true,
      data: {
        community: {
          ...community.toObject(),
          isMember,
          isOwner,
          memberRole,
        },
        posts: postsWithVotes,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
});



// ✏️ Edit Community
router.patch("/:name", auth, writeLimiter, async (req, res) => {
  try {
    const finalName = normalizeName(req.params.name);
    const community = await Community.findOne({ name: finalName });

    if (!community) {
      return res
        .status(404)
        .json({ success: false, error: "Community not found" });
    }

    if (community.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, error: "Only owner can edit" });
    }

    const allowed = [
      "title",
      "description",
      "isPrivate",
      "rules",
      "icon",
      "banner",
    ];
    allowed.forEach((f) => {
      if (req.body[f] !== undefined) community[f] = req.body[f];
    });

    await community.save();
    res.json({ success: true, data: community });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Upload Icon
router.post("/:name/icon", auth, upload.single("icon"), async (req, res) => {
  try {
    const name = normalizeName(req.params.name);
    const community = await Community.findOne({ name });
    if (!community) {
      return res.status(404).json({ error: "Community not found" });
    }

    if (community.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Only owner can update icon" });
    }

    community.icon = req.file.path;
    await community.save();

    res.json({ success: true, data: { icon: community.icon } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload Banner
router.post("/:name/banner", auth, upload.single("banner"), async (req, res) => {
  try {
    const name = normalizeName(req.params.name);
    const community = await Community.findOne({ name });
    if (!community) {
      return res.status(404).json({ error: "Community not found" });
    }

    if (community.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Only owner can update banner" });
    }

    community.banner = req.file.path;
    await community.save();

    res.json({ success: true, data: { banner: community.banner } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
