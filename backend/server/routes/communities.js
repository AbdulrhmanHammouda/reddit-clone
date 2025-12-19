// backend/routes/communities.js
const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const Community = require("../models/Community");
const CommunityMember = require("../models/CommunityMember");
const JoinRequest = require("../models/JoinRequest");
const Post = require("../models/Post");
const Vote = require("../models/Vote");
const SavedPost = require("../models/SavedPost");

const auth = require("../middleware/authMiddleware");
const optionalAuth = require("../middleware/optionalAuth");
const { writeLimiter } = require("../middleware/rateLimiter");

// 🛠 Utility to normalize community name
function normalizeName(name) {
  return (name || "").toLowerCase();
}

// 🕐 Time filter helper for "top" sort
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


// backend/routes/communities.js

router.post("/", auth, writeLimiter, async (req, res) => {
  try {
    const { name, title, description, isPrivate, rules, interests } = req.body;

    // Ensure interests is an array and not undefined
    if (!Array.isArray(interests) || interests.length < 1) {
      return res.status(400).json({ success: false, error: "No interests selected" });
    }

    const finalName = normalizeName(name);
    const exists = await Community.findOne({ name: finalName });
    if (exists) {
      return res.status(400).json({ success: false, error: "Community already exists" });
    }

    const community = await Community.create({
      name: finalName,
      title,
      description,
      createdBy: req.user._id,
      isPrivate: !!isPrivate,
      rules: rules || [],
      interests: interests,  // Save the selected topics/interests
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


/* ---------------------------------------------------------------------------
   🔥 TRENDING COMMUNITIES - MUST be before /:name route!
--------------------------------------------------------------------------- */
router.get("/trending", optionalAuth, async (req, res) => {
  try {
    const limit = Math.min(20, Number(req.query.limit) || 10);
    const userId = req.user?._id;

    // Get communities sorted by member count as a simple trending metric
    const communities = await Community.find()
      .sort({ membersCount: -1 })
      .limit(limit)
      .select("name title description icon membersCount interests");

    // Add isMember flag if user is logged in
    let result = communities.map(c => c.toObject());
    if (userId) {
      const memberOf = await CommunityMember.find({ user: userId }).select("community");
      const memberIds = new Set(memberOf.map(m => m.community.toString()));
      result = result.map(c => ({ ...c, isMember: memberIds.has(c._id.toString()) }));
    } else {
      result = result.map(c => ({ ...c, isMember: false }));
    }

    res.json({ success: true, data: result });
  } catch (err) {
    console.error("GET /communities/trending error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ---------------------------------------------------------------------------
   🧭 EXPLORE COMMUNITIES - MUST be before /:name route!
--------------------------------------------------------------------------- */
router.get("/explore", optionalAuth, async (req, res) => {
  try {
    const category = req.query.category || null;
    const limit = Math.min(50, Number(req.query.limit) || 20);
    const userId = req.user?._id;

    // Get all unique interests from communities
    const allInterests = await Community.distinct("interests");

    let communities;
    
    if (category && category !== "All") {
      communities = await Community.find({ interests: category })
        .sort({ membersCount: -1 })
        .limit(limit)
        .select("name title description icon membersCount interests");
    } else {
      communities = await Community.find()
        .sort({ membersCount: -1 })
        .limit(limit)
        .select("name title description icon membersCount interests");
    }

    // Add isMember flag
    let communitiesWithMembership = communities.map(c => c.toObject());
    if (userId) {
      const memberOf = await CommunityMember.find({ user: userId }).select("community");
      const memberIds = new Set(memberOf.map(m => m.community.toString()));
      communitiesWithMembership = communitiesWithMembership.map(c => ({
        ...c,
        isMember: memberIds.has(c._id.toString())
      }));
    } else {
      communitiesWithMembership = communitiesWithMembership.map(c => ({
        ...c,
        isMember: false
      }));
    }

    // Group by category
    let grouped = {};
    allInterests.forEach(interest => {
      grouped[interest] = communitiesWithMembership
        .filter(c => c.interests?.includes(interest))
        .slice(0, 6);
    });

    res.json({
      success: true,
      data: {
        categories: allInterests,
        communities: communitiesWithMembership,
        grouped: grouped
      }
    });
  } catch (err) {
    console.error("GET /communities/explore error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 🧭 Get Community Basic Details - MUST be AFTER /trending and /explore!
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

/* ---------------------------------------------------------------------------
   🔥 TRENDING COMMUNITIES - Based on recent activity and growth
   trendingScore = (posts in last 48h × 3) + (new members in last 48h)
--------------------------------------------------------------------------- */
router.get("/trending", optionalAuth, async (req, res) => {
  try {
    const limit = Math.min(20, Number(req.query.limit) || 10);
    const userId = req.user?._id;

    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    // Get all communities with their recent activity
    const communities = await Community.aggregate([
      // Count recent posts
      {
        $lookup: {
          from: "posts",
          let: { communityId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$community", "$$communityId"] },
                    { $gte: ["$createdAt", fortyEightHoursAgo] }
                  ]
                }
              }
            },
            { $count: "count" }
          ],
          as: "recentPosts"
        }
      },
      // Count recent members
      {
        $lookup: {
          from: "communitymembers",
          let: { communityId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$community", "$$communityId"] },
                    { $gte: ["$createdAt", fortyEightHoursAgo] }
                  ]
                }
              }
            },
            { $count: "count" }
          ],
          as: "recentMembers"
        }
      },
      // Calculate trending score
      {
        $addFields: {
          recentPostCount: { $ifNull: [{ $arrayElemAt: ["$recentPosts.count", 0] }, 0] },
          recentMemberCount: { $ifNull: [{ $arrayElemAt: ["$recentMembers.count", 0] }, 0] }
        }
      },
      {
        $addFields: {
          trendingScore: {
            $add: [
              { $multiply: ["$recentPostCount", 3] },
              "$recentMemberCount"
            ]
          }
        }
      },
      // Sort and limit
      { $sort: { trendingScore: -1, membersCount: -1 } },
      { $limit: limit },
      // Project only needed fields
      {
        $project: {
          _id: 1,
          name: 1,
          title: 1,
          description: 1,
          icon: 1,
          membersCount: 1,
          trendingScore: 1,
          interests: 1
        }
      }
    ]);

    // Add isMember flag if user is logged in
    if (userId) {
      const memberOf = await CommunityMember.find({ user: userId }).select("community");
      const memberIds = new Set(memberOf.map(m => m.community.toString()));
      communities.forEach(c => {
        c.isMember = memberIds.has(c._id.toString());
      });
    } else {
      communities.forEach(c => { c.isMember = false; });
    }

    res.json({ success: true, data: communities });
  } catch (err) {
    console.error("GET /communities/trending error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ---------------------------------------------------------------------------
   🧭 EXPLORE COMMUNITIES - Grouped by interests/categories
--------------------------------------------------------------------------- */
router.get("/explore", optionalAuth, async (req, res) => {
  try {
    const category = req.query.category || null;
    const limit = Math.min(50, Number(req.query.limit) || 20);
    const userId = req.user?._id;

    // Get all unique interests from communities
    const allInterests = await Community.distinct("interests");

    let communities;
    
    if (category && category !== "All") {
      // Filter by specific category
      communities = await Community.find({ interests: category })
        .sort({ membersCount: -1 })
        .limit(limit)
        .select("name title description icon membersCount interests");
    } else {
      // Get top communities across all categories
      communities = await Community.find()
        .sort({ membersCount: -1 })
        .limit(limit)
        .select("name title description icon membersCount interests");
    }

    // Add isMember flag if user is logged in
    let communitiesWithMembership = communities.map(c => c.toObject());
    if (userId) {
      const memberOf = await CommunityMember.find({ user: userId }).select("community");
      const memberIds = new Set(memberOf.map(m => m.community.toString()));
      communitiesWithMembership = communitiesWithMembership.map(c => ({
        ...c,
        isMember: memberIds.has(c._id.toString())
      }));
    } else {
      communitiesWithMembership = communitiesWithMembership.map(c => ({
        ...c,
        isMember: false
      }));
    }

    // Group by category if no specific category requested
    let grouped = null;
    if (!category || category === "All") {
      grouped = {};
      allInterests.forEach(interest => {
        grouped[interest] = communitiesWithMembership
          .filter(c => c.interests?.includes(interest))
          .slice(0, 10);
      });
    }

    res.json({
      success: true,
      data: {
        categories: allInterests,
        communities: communitiesWithMembership,
        grouped: grouped
      }
    });
  } catch (err) {
    console.error("GET /communities/explore error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ➕ Join Community (or Request to Join for Private)
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

    // Check if already a member
    const existing = await CommunityMember.findOne({
      user: userId,
      community: community._id,
    });

    if (existing) {
      return res.json({
        success: true,
        joined: true,
        membersCount: community.membersCount,
      });
    }

    // For PRIVATE communities, create a join request instead
    if (community.isPrivate) {
      // Check if there's already a pending request
      const existingRequest = await JoinRequest.findOne({
        user: userId,
        community: community._id,
        status: 'pending',
      });

      if (existingRequest) {
        return res.json({
          success: true,
          requestPending: true,
          message: "Your request is pending approval",
        });
      }

      // Create new join request
      await JoinRequest.create({
        user: userId,
        community: community._id,
        message: req.body.message || '',
      });

      return res.json({
        success: true,
        requestPending: true,
        message: "Join request submitted",
      });
    }

    // For PUBLIC communities, join directly
    await CommunityMember.create({
      user: userId,
      community: community._id,
      role: "member",
    });

    community.membersCount++;
    await community.save();

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

// 📋 Get Pending Join Requests (Moderators/Owners only)
router.get("/:name/join-requests", auth, async (req, res) => {
  try {
    const finalName = normalizeName(req.params.name);
    const community = await Community.findOne({ name: finalName });
    if (!community) {
      return res.status(404).json({ success: false, error: "Community not found" });
    }

    const userId = req.user._id;

    // Check if user is owner or moderator
    const isOwner = community.createdBy.toString() === userId.toString();
    const membership = await CommunityMember.findOne({
      user: userId,
      community: community._id,
      role: { $in: ["owner", "moderator"] },
    });

    if (!isOwner && !membership) {
      return res.status(403).json({ success: false, error: "Not authorized" });
    }

    const requests = await JoinRequest.find({
      community: community._id,
      status: "pending",
    })
      .populate("user", "username avatar createdAt")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: requests.map((r) => ({
        _id: r._id,
        user: {
          _id: r.user._id,
          username: r.user.username,
          avatar: r.user.avatar,
          createdAt: r.user.createdAt,
        },
        message: r.message,
        createdAt: r.createdAt,
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ Approve Join Request
router.post("/:name/join-requests/:requestId/approve", auth, writeLimiter, async (req, res) => {
  try {
    const finalName = normalizeName(req.params.name);
    const community = await Community.findOne({ name: finalName });
    if (!community) {
      return res.status(404).json({ success: false, error: "Community not found" });
    }

    const userId = req.user._id;

    // Check if user is owner or moderator
    const isOwner = community.createdBy.toString() === userId.toString();
    const membership = await CommunityMember.findOne({
      user: userId,
      community: community._id,
      role: { $in: ["owner", "moderator"] },
    });

    if (!isOwner && !membership) {
      return res.status(403).json({ success: false, error: "Not authorized" });
    }

    const request = await JoinRequest.findById(req.params.requestId);
    if (!request || request.community.toString() !== community._id.toString()) {
      return res.status(404).json({ success: false, error: "Request not found" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ success: false, error: "Request already processed" });
    }

    // Update request status
    request.status = "approved";
    request.reviewedBy = userId;
    request.reviewedAt = new Date();
    await request.save();

    // Add user as member
    const existingMember = await CommunityMember.findOne({
      user: request.user,
      community: community._id,
    });

    if (!existingMember) {
      await CommunityMember.create({
        user: request.user,
        community: community._id,
        role: "member",
      });

      community.membersCount++;
      await community.save();
    }

    res.json({
      success: true,
      message: "Request approved",
      membersCount: community.membersCount,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ❌ Reject Join Request
router.post("/:name/join-requests/:requestId/reject", auth, writeLimiter, async (req, res) => {
  try {
    const finalName = normalizeName(req.params.name);
    const community = await Community.findOne({ name: finalName });
    if (!community) {
      return res.status(404).json({ success: false, error: "Community not found" });
    }

    const userId = req.user._id;

    // Check if user is owner or moderator
    const isOwner = community.createdBy.toString() === userId.toString();
    const membership = await CommunityMember.findOne({
      user: userId,
      community: community._id,
      role: { $in: ["owner", "moderator"] },
    });

    if (!isOwner && !membership) {
      return res.status(403).json({ success: false, error: "Not authorized" });
    }

    const request = await JoinRequest.findById(req.params.requestId);
    if (!request || request.community.toString() !== community._id.toString()) {
      return res.status(404).json({ success: false, error: "Request not found" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ success: false, error: "Request already processed" });
    }

    // Update request status
    request.status = "rejected";
    request.reviewedBy = userId;
    request.reviewedAt = new Date();
    await request.save();

    res.json({
      success: true,
      message: "Request rejected",
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 📝 Get Community + Posts (with owner/join info + voting info) + sort
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

    // Fetch moderators (owner + moderators)
    const moderatorMembers = await CommunityMember.find({
      community: community._id,
      role: { $in: ["owner", "moderator"] },
    })
      .populate("user", "username avatar")
      .limit(10);

    const moderators = moderatorMembers.map((m) => ({
      username: m.user?.username || "Unknown",
      avatar: m.user?.avatar || null,
      role: m.role,
    }));

    // 🔒 Private Community Access Control
    if (community.isPrivate && !isMember) {
      // Check if user has a pending request
      let requestPending = false;
      if (userId) {
        const pendingRequest = await JoinRequest.findOne({
          user: userId,
          community: community._id,
          status: 'pending',
        });
        requestPending = !!pendingRequest;
      }

      return res.json({
        success: true,
        data: {
          community: {
            _id: community._id,
            name: community.name,
            title: community.title,
            icon: community.icon,
            banner: community.banner,
            membersCount: community.membersCount,
            createdAt: community.createdAt,
            isPrivate: true,
            isMember: false,
            isOwner: false,
            memberRole: null,
            moderators: [],
            requestPending, // Tell frontend if request is pending
          },
          posts: [],
          isPrivateRestricted: true,
          page: 1,
          limit: 20,
        },
      });
    }

    const sort = (req.query.sort || "best").toLowerCase();
    const time = (req.query.time || "all").toLowerCase();
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const match = { community: community._id, ...timeWindowMatch(sort === "top" ? time : "all") };

    const pipeline = [{ $match: match }];

    const now = new Date();
    const ageHoursExpr = {
      $divide: [{ $subtract: [now, "$createdAt"] }, 1000 * 3600],
    };

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

    let posts = await Post.aggregate(pipeline);
    posts = await Post.populate(posts, [
      { path: "author", select: "username avatar" },
      { path: "community", select: "name title icon membersCount" },
    ]);


    // Attach score + yourVote to each post (✔ fixed vote field)
    const postsWithVotes = await Promise.all(
      posts.map(async (post) => {
        const scoreAgg = await Vote.aggregate([
          { $match: { post: post._id } },
          { $group: { _id: "$post", score: { $sum: "$value" } } },
        ]);

        const score = scoreAgg[0]?.score || 0;

        let yourVote = 0;
        let saved = false; // Initialize saved flag

        if (userId) {
          const v = await Vote.findOne({ user: userId, post: post._id });
          if (v) yourVote = v.value;

          // Check if post is saved by the user
          const s = await SavedPost.findOne({ user: userId, post: post._id });
          if (s) saved = true;
        }

        return {
          ...post,
          score,
          yourVote,
          saved, // Include the saved flag
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
          moderators, // Include moderators list
        },
        posts: postsWithVotes,
        page,
        limit,
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
