
const mongoose = require('mongoose');


const UserSchema = new mongoose.Schema({
username: { type: String, required: true, unique: true, index: true },
email: { type: String, required: true, unique: true, index: true },
passwordHash: { type: String, required: true },
bio: { type: String, default: '' },
avatar: { type: String },
displayName: { type: String },
createdAt: { type: Date, default: Date.now },

// Settings subdocument
settings: {
  // Privacy
  allowFollowers: { type: Boolean, default: true },
  showOnlineStatus: { type: Boolean, default: true },
  allowDirectMessages: { type: Boolean, default: true },
  showInSearchResults: { type: Boolean, default: true },
  
  // Content Preferences
  showNSFW: { type: Boolean, default: false },
  blurNSFW: { type: Boolean, default: true },
  autoplayMedia: { type: Boolean, default: true },
  reduceMotion: { type: Boolean, default: false },
  showRecommendations: { type: Boolean, default: true },
  
  // Notifications
  emailNotifications: { type: Boolean, default: true },
  commentReplyNotifications: { type: Boolean, default: true },
  mentionNotifications: { type: Boolean, default: true },
  upvoteNotifications: { type: Boolean, default: false },
  newFollowerNotifications: { type: Boolean, default: true },
  chatMessageNotifications: { type: Boolean, default: true }
}
});


module.exports = mongoose.model('User', UserSchema);
