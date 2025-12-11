const Notification = require('../models/Notification');
const User = require('../models/User');

async function createNotification({
  user, // who will receive notification
  type,
  sourceUser,
  sourcePost,
  sourceComment
}) {
  if (!user || !sourceUser) return;

  // Don't notify user about their own actions
  if (user.toString() === sourceUser.toString()) return;

  // Get user settings to check notification preferences
  const recipient = await User.findById(user).select('settings');
  if (!recipient) return;

  const settings = recipient.settings || {};

  // Check notification preferences based on type
  const notificationChecks = {
    'comment_reply': settings.commentReplyNotifications !== false,
    'reply': settings.commentReplyNotifications !== false,
    'comment': settings.commentReplyNotifications !== false,
    'mention': settings.mentionNotifications !== false,
    'upvote': settings.upvoteNotifications !== false,
    'post_upvote': settings.upvoteNotifications !== false,
    'comment_upvote': settings.upvoteNotifications !== false,
    'follow': settings.newFollowerNotifications !== false,
    'message': settings.chatMessageNotifications !== false
  };

  // If this type has a preference check, respect it (default to true for unknown types)
  const shouldNotify = notificationChecks[type] ?? true;
  
  if (!shouldNotify) {
    return; // User has disabled this notification type
  }

  await Notification.create({
    user,
    type,
    sourceUser,
    sourcePost,
    sourceComment
  });
}

module.exports = createNotification;
