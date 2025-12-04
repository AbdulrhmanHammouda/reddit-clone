
const express = require('express');
const router = express.Router();
const Community = require('../models/Community');
const auth = require('../middleware/authMiddleware');



router.post('/', auth, async (req, res) => {
	try {
		const { name, title, description } = req.body;
		if (!name || !title) return res.status(400).json({ error: 'Missing fields' });

		const exists = await Community.findOne({ name });
		if (exists) return res.status(400).json({ error: 'Community already exists' });

		const community = await Community.create({ name, title, description, createdBy: req.user._id });
		res.json(community);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});



router.get('/:name', async (req, res) => {
	try {
		const community = await Community.findOne({ name: req.params.name });
		if (!community) return res.status(404).json({ error: 'Not found' });
		res.json(community);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});



router.get('/', async (req, res) => {
	try {
		const items = await Community.find().sort({ membersCount: -1 }).limit(50).select('name title description membersCount');
		res.json(items);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});


// Join community
router.post('/:name/join', auth, async (req, res) => {
	try {
		const community = await Community.findOne({ name: req.params.name });
		if (!community) return res.status(404).json({ error: 'Not found' });
		community.membersCount = (community.membersCount || 0) + 1;
		await community.save();
		res.json({ success: true, membersCount: community.membersCount });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Leave community
router.post('/:name/leave', auth, async (req, res) => {
	try {
		const community = await Community.findOne({ name: req.params.name });
		if (!community) return res.status(404).json({ error: 'Not found' });
		community.membersCount = Math.max(0, (community.membersCount || 0) - 1);
		await community.save();
		res.json({ success: true, membersCount: community.membersCount });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});


module.exports = router;