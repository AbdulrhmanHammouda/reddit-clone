
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
		const page = Math.max(1, parseInt(req.query.page || '1'));
		const limit = 10;
		const { community, sort } = req.query;
		const filter = {};
		if (community) {
			const comm = await Community.findOne({ name: community });
			if (!comm) return res.json({ posts: [], page, totalPages: 0 });
			filter.community = comm._id;
		}

		// count total
		const total = await Post.countDocuments(filter);
		const totalPages = Math.max(1, Math.ceil(total / limit));

		const sortParam = (sort || 'new').toLowerCase();

		// new = newest first; top = highest score; hot = score + age decay
		if (sortParam === 'hot') {
			// fetch candidates, compute hot score in JS, sort and paginate
			const candidates = await Post.find(filter)
				.populate('author', 'username')
				.populate('community', 'name title')
				.lean();

			const now = Date.now();
			candidates.forEach((p) => {
				const created = new Date(p.createdAt).getTime();
				const hours = Math.max(0, (now - created) / 36e5);
				// simple decay: score / (hours + 2)^1.5
				p.hotScore = (p.score || 0) / Math.pow(hours + 2, 1.5);
			});

			candidates.sort((a, b) => (b.hotScore || 0) - (a.hotScore || 0));
			const start = (page - 1) * limit;
			const pageItems = candidates.slice(start, start + limit);
			return res.json({ posts: pageItems, page, totalPages });
		}

		// top or new
		let sortCriteria = { createdAt: -1 };
		if (sortParam === 'top' || sortParam === 'best') sortCriteria = { score: -1, createdAt: -1 };
		if (sortParam === 'new') sortCriteria = { createdAt: -1 };

		const posts = await Post.find(filter)
			.sort(sortCriteria)
			.skip((page - 1) * limit)
			.limit(limit)
			.populate('author', 'username')
			.populate('community', 'name title');

		res.json({ posts, page, totalPages });
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