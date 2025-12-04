
const express = require('express');
const router = express.Router();
const Community = require('../models/Community');
const auth = require('../midddleware/authMiddleware');



router.post('/', auth, async (req, res) => {
try {
const { name, title, description } = req.body;
if (!name || !title) return res.status(400).json({ message: 'Missing fields' });


const exists = await Community.findOne({ name });
if (exists) return res.status(400).json({ message: 'Community already exists' });


const community = await Community.create({ name, title, description, createdBy: req.user._id });
res.json(community);
} catch (err) {
res.status(500).json({ message: err.message });
}
});



router.get('/:name', async (req, res) => {
try {
const community = await Community.findOne({ name: req.params.name });
if (!community) return res.status(404).json({ message: 'Not found' });
res.json(community);
} catch (err) {
res.status(500).json({ message: err.message });
}
});



router.get('/', async (req, res) => {
try {
const items = await Community.find().sort({ membersCount: -1 }).limit(50);
res.json(items);
} catch (err) {
res.status(500).json({ message: err.message });
}
});


module.exports = router;