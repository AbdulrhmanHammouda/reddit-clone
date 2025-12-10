const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['reply', 'vote', 'message', 'community_invite', 'follow'],
    required: true,
  },
  sourceUser: { // User who triggered the notification (e.g., replied, voted)
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  sourcePost: { // Post related to the notification
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
  },
  sourceComment: { // Comment related to the notification
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
  },
  sourceCommunity: { // Community related to the notification
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
  },
  read: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Notification', NotificationSchema);