
const mongoose = require('mongoose');


const CommentSchema = new mongoose.Schema({
post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
body: { type: String, required: true },
parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null, index: true },
score: { type: Number, default: 0 },
createdAt: { type: Date, default: Date.now },
images: { 
    type: [String], 
    default: [] 
  },
});

// Compound indexes for common queries
CommentSchema.index({ post: 1, createdAt: -1 }); // Comments on a post sorted by date
CommentSchema.index({ author: 1, createdAt: -1 }); // User's comment history

module.exports = mongoose.model('Comment', CommentSchema);
