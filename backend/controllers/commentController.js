const Comment = require('../models/Comment');
const Task = require('../models/Task');
const { createNotification } = require('../utils/notifications');

exports.getComments = async (req, res) => {
  try {
    const { taskId } = req.query;
    const comments = await Comment.find({ task: taskId, parent: null })
      .populate('author', 'name email avatar')
      .populate('mentions', 'name email')
      .sort({ createdAt: 1 });

    const withReplies = await Promise.all(comments.map(async (comment) => {
      const replies = await Comment.find({ parent: comment._id })
        .populate('author', 'name email avatar')
        .populate('mentions', 'name email')
        .sort({ createdAt: 1 });
      return { ...comment.toObject(), replies };
    }));

    res.json({ success: true, data: withReplies });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createComment = async (req, res) => {
  try {
    const { taskId, content, mentions, parentId } = req.body;
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const comment = await Comment.create({
      task: taskId,
      author: req.user._id,
      content,
      mentions: mentions || [],
      parent: parentId || null
    });

    const populated = await comment.populate([
      { path: 'author', select: 'name email avatar' },
      { path: 'mentions', select: 'name email' }
    ]);

    if (mentions && mentions.length > 0) {
      for (const userId of mentions) {
        if (userId !== req.user._id.toString()) {
          await createNotification({
            recipient: userId,
            sender: req.user._id,
            type: 'mention',
            title: 'You were mentioned',
            message: `${req.user.name} mentioned you in a comment`,
            relatedTask: taskId,
            relatedProject: task.project
          }, req.app.get('io'));
        }
      }
    }

    await createNotification({
      recipient: task.createdBy,
      sender: req.user._id,
      type: 'comment_added',
      title: 'New Comment',
      message: `${req.user.name} commented on task`,
      relatedTask: taskId,
      relatedProject: task.project
    }, req.app.get('io'));

    const io = req.app.get('io');
    io.to(`task_${taskId}`).emit('comment_added', populated);

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
    if (!comment.author.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    comment.content = req.body.content;
    comment.isEdited = true;
    comment.editedAt = new Date();
    await comment.save();
    const populated = await comment.populate('author', 'name email avatar');
    res.json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
    const canDelete = comment.author.equals(req.user._id) || req.user.role === 'admin';
    if (!canDelete) return res.status(403).json({ success: false, message: 'Not authorized' });
    await Comment.deleteMany({ parent: req.params.id });
    await Comment.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
