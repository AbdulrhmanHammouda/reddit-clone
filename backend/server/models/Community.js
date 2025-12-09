// models/Community.js
const mongoose = require('mongoose');

const CommunitySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // 🔹 these fields were missing
  isPrivate: { type: Boolean, default: false },
  rules: { type: [String], default: [] },

  icon: { type: String, default: '/default-community.png' },
  banner: { type: String, default: '' },

  membersCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  interests: { type: [String], default: [] },

});

module.exports = mongoose.model('Community', CommunitySchema);
