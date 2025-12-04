const mongoose = require('mongoose');


const VoteSchema = new mongoose.Schema({
user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
value: { type: Number, enum: [1, -1], required: true },
createdAt: { type: Date, default: Date.now }
});


VoteSchema.index({ user: 1, post: 1 }, { unique: true });


module.exports = mongoose.model('Vote', VoteSchema);