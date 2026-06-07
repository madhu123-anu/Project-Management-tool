const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: {
    type: String,
    enum: [
      'project_created', 'project_updated', 'project_deleted', 'project_archived',
      'task_created', 'task_updated', 'task_deleted', 'task_status_changed',
      'comment_posted', 'member_added', 'member_removed', 'file_uploaded', 'file_deleted'
    ],
    required: true
  },
  description: { type: String, required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

activitySchema.index({ project: 1, createdAt: -1 });
activitySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
