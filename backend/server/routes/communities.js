
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

		const community = await Community.create({ name, title, description, createdBy: req.user._id, members: [req.user._id], membersCount: 1 });
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
		// prevent double join
		const uid = req.user._id;
		if (community.members && community.members.find((m) => String(m) === String(uid))) {
			return res.status(400).json({ error: 'Already a member' });
		}
		community.members = community.members || [];
		community.members.push(uid);
		community.membersCount = community.members.length;
		await community.save();
		res.json(community);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Leave community
router.post('/:name/leave', auth, async (req, res) => {
	try {
		const community = await Community.findOne({ name: req.params.name });
		if (!community) return res.status(404).json({ error: 'Not found' });
		const uid = String(req.user._id);
		community.members = (community.members || []).filter((m) => String(m) !== uid);
		community.membersCount = community.members.length;
		await community.save();
		res.json(community);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});


module.exports = router;