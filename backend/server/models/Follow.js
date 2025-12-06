// models/Follow.js
const mongoose = require("mongoose");

const FollowSchema = new mongoose.Schema({
  follower: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  following: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, {
  timestamps: true
});

// A user cannot follow the same person twice
FollowSchema.index({ follower: 1, following: 1 }, { unique: true });

module.exports = mongoose.model("Follow", FollowSchema);
