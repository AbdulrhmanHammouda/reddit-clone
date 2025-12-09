const mongoose = require('mongoose');

const SavedCommentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  comment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    required: true,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

SavedCommentSchema.index({ user: 1, comment: 1 }, { unique: true });

module.exports = mongoose.model('SavedComment', SavedCommentSchema);
