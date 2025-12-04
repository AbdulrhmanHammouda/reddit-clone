
const jwt = require('jsonwebtoken');
const User = require('../models/User');


module.exports = async (req, res, next) => {
const token = req.header('Authorization')?.replace('Bearer ', '');
if (!token) return res.status(401).json({ message: 'No token provided' });


try {
const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
const user = await User.findById(payload.id).select('-passwordHash');
if (!user) return res.status(401).json({ message: 'Invalid token' });
req.user = user;
next();
} catch (err) {
res.status(401).json({ message: 'Invalid token' });
}
};