
const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Community = require('../models/Community');
const Vote = require('../models/Vote');
const auth = require('../middleware/authMiddleware');



router.post('/', auth, async (req, res) => {
	try {
		const { title, body, communityName, url } = req.body;
		if (!title || !communityName) return res.status(400).json({ error: 'Missing fields' });

		const community = await Community.findOne({ name: communityName });
		if (!community) return res.status(404).json({ error: 'Community not found' });

		const post = await Post.create({ title, body, author: req.user._id, community: community._id, url });
		res.json(await post.populate('author', 'username').populate('community', 'name title'));
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});



router.get('/', async (req, res) => {
	try {
		const page = parseInt(req.query.page || '1');
		const limit = 20;
		const { community, sort } = req.query;
		const filter = {};
		if (community) {
			const comm = await Community.findOne({ name: community });
			if (!comm) return res.json([]);
			filter.community = comm._id;
		}

		// sort: 'best' = by score desc, 'new' = by createdAt desc (default)
		let sortCriteria = { createdAt: -1 };
		if (sort === 'best') sortCriteria = { score: -1, createdAt: -1 };
		if (sort === 'new') sortCriteria = { createdAt: -1 };

		const posts = await Post.find(filter)
			.sort(sortCriteria)
			.skip((page - 1) * limit)
			.limit(limit)
			.populate('author', 'username')
			.populate('community', 'name title');

		res.json(posts);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});


router.get('/:id', async (req, res) => {
	try {
		const post = await Post.findById(req.params.id).populate('author', 'username').populate('community', 'name title');
		if (!post) return res.status(404).json({ error: 'Not found' });
		res.json(post);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

module.exports = router;