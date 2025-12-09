
const mongoose = require('mongoose');


const CommentSchema = new mongoose.Schema({
post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
body: { type: String, required: true },
parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
score: { type: Number, default: 0 },
createdAt: { type: Date, default: Date.now },
images: { 
    type: [String], 
    default: [] 
  },
});


module.exports = mongoose.model('Comment', CommentSchema);