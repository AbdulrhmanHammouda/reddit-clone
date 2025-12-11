
const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  community: { type: mongoose.Schema.Types.ObjectId, ref: "Community", required: true, index: true },
  url: { type: String },
  images: { type: [String], default: [] },
  videoUrl: { type: String, default: null },
  processing: { type: Boolean, default: false },
  score: { type: Number, default: 0, index: true },
  commentsCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date },
});

// Compound indexes for common queries
PostSchema.index({ community: 1, createdAt: -1 }); // Community feed sorted by date
PostSchema.index({ author: 1, createdAt: -1 });    // User profile posts
PostSchema.index({ community: 1, score: -1 });     // Community feed sorted by score
PostSchema.index({ title: 'text', body: 'text' }); // Text search

module.exports = mongoose.model("Post", PostSchema);
