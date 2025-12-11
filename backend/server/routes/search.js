const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const Community = require('../models/Community');

// GET /api/search?q= -> search posts, users, communities
router.get('/', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ success: false, data: null, error: 'Query parameter "q" is required' });
    }

    const searchResults = {};
    const searchOptions = { $regex: query, $options: 'i' }; // Case-insensitive search

    // Search Posts
    const posts = await Post.find({
      $or: [
        { title: searchOptions },
        { body: searchOptions },
      ],
    })
    .populate('author', 'username')
    .populate('community', 'name title')
    .limit(10); // Limit results for each category
    searchResults.posts = posts;

    // Search Users (only those who allow search visibility)
    const users = await User.find({
      $and: [
        {
          $or: [
            { username: searchOptions },
            { displayName: searchOptions },
          ],
        },
        // Only include users who allow being found in search OR have no settings yet
        { $or: [
          { 'settings.showInSearchResults': { $ne: false } },
          { 'settings.showInSearchResults': { $exists: false } }
        ]}
      ]
    })
    .select('username displayName avatar')
    .limit(5);
    searchResults.users = users;

    // Search Communities
    const communities = await Community.find({
      $or: [
        { name: searchOptions },
        { title: searchOptions },
        { description: searchOptions },
      ],
    })
    .select('name title description membersCount')
    .limit(5);
    searchResults.communities = communities;

    res.status(200).json({ success: true, data: searchResults, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
});

module.exports = router;