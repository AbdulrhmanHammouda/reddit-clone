
const mongoose = require('mongoose');


const CommunitySchema = new mongoose.Schema({
name: { type: String, required: true, unique: true, index: true },
title: { type: String, required: true },
description: { type: String, default: '' },
createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
membersCount: { type: Number, default: 0 },
createdAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model('Community', CommunitySchema);