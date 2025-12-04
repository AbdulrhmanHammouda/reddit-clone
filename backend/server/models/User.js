
const mongoose = require('mongoose');


const UserSchema = new mongoose.Schema({
username: { type: String, required: true, unique: true, index: true },
email: { type: String, required: true, unique: true, index: true },
passwordHash: { type: String, required: true },
bio: { type: String, default: '' },
avatarUrl: { type: String },
createdAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model('User', UserSchema);