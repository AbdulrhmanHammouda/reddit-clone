// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { writeLimiter } = require('../middleware/rateLimiter'); // New import


// signup
router.post('/signup', writeLimiter, async (req, res) => { // Added writeLimiter
	try {
		const { email, password } = req.body;
		const username = req.body.username.trim();
		if (!username || !email || !password) return res.status(400).json({ success: false, data: null, error: 'Missing fields' });
 
		const exists = await User.findOne({ $or: [{ email }, { username }] });
		if (exists) return res.status(400).json({ success: false, data: null, error: 'User already exists' });

		const salt = await bcrypt.genSalt(10);
		const passwordHash = await bcrypt.hash(password, salt);

		const user = await User.create({ username, email, passwordHash });
		const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });

		res.status(201).json({ success: true, data: { token, user: { id: user._id, username: user.username, email: user.email } }, error: null });
	} catch (err) {
		res.status(500).json({ success: false, data: null, error: err.message });
	}
});


// login
router.post('/login', writeLimiter, async (req, res) => { // Added writeLimiter
	try {
		const { emailOrUsername, password } = req.body;
		const user = await User.findOne({ $or: [{ email: emailOrUsername }, { username: emailOrUsername }] });
		if (!user) return res.status(400).json({ success: false, data: null, error: 'Invalid credentials' });

		const isMatch = await bcrypt.compare(password, user.passwordHash);
		if (!isMatch) return res.status(400).json({ success: false, data: null, error: 'Invalid credentials' });

		const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
		res.status(200).json({ success: true, data: { token, user: { id: user._id, username: user.username, email: user.email } }, error: null });
	} catch (err) {
		res.status(500).json({ success: false, data: null, error: err.message });
	}
});


module.exports = router;