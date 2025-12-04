// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');


// signup
router.post('/signup', async (req, res) => {
try {
const { username, email, password } = req.body;
if (!username || !email || !password) return res.status(400).json({ message: 'Missing fields' });


const exists = await User.findOne({ $or: [{ email }, { username }] });
if (exists) return res.status(400).json({ message: 'User already exists' });


const salt = await bcrypt.genSalt(10);
const passwordHash = await bcrypt.hash(password, salt);


const user = await User.create({ username, email, passwordHash });
const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });


res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
} catch (err) {
res.status(500).json({ message: err.message });
}
});


// login
router.post('/login', async (req, res) => {
try {
const { emailOrUsername, password } = req.body;
const user = await User.findOne({ $or: [{ email: emailOrUsername }, { username: emailOrUsername }] });
if (!user) return res.status(400).json({ message: 'Invalid credentials' });


const isMatch = await bcrypt.compare(password, user.passwordHash);
if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });


const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
} catch (err) {
res.status(500).json({ message: err.message });
}
});


module.exports = router;