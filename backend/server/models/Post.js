
const mongoose = require('mongoose');


const PostSchema = new mongoose.Schema({
title: { type: String, required: true },
body: { type: String },
author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true, index: true },
url: { type: String },
score: { type: Number, default: 0, index: true },
commentsCount: { type: Number, default: 0 },
createdAt: { type: Date, default: Date.now },
updatedAt: { type: Date }
});


module.exports = mongoose.model('Post', PostSchema);