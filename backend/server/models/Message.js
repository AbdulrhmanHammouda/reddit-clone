const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    trim: true,
    default: '',
  },
  // Attachment support
  attachment: {
    url: { type: String },
    type: { type: String, enum: ['image', 'video', 'file'] },
    filename: { type: String },
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

// Either content or attachment must be present
MessageSchema.pre('validate', function (next) {
  if (!this.content && !this.attachment?.url) {
    next(new Error('Message must have content or an attachment'));
  } else {
    next();
  }
});

module.exports = mongoose.model('Message', MessageSchema);