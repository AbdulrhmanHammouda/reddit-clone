
const mongoose = require('mongoose');


const CommentSchema = new mongoose.Schema({
post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
body: { type: String, required: true },
parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
createdAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model('Comment', CommentSchema);