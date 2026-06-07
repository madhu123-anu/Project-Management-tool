const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: [
      'task_assigned', 'task_completed', 'task_updated',
      'deadline_near', 'project_updated', 'comment_added',
      'mention', 'member_added', 'member_removed'
    ],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: String,
  isRead: { type: Boolean, default: false },
  readAt: Date,
  relatedProject: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  relatedTask: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' }
}, { timestamps: true });

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
