const Task = require('../models/Task');
const Project = require('../models/Project');
const Activity = require('../models/Activity');
const { createNotification } = require('../utils/notifications');

const updateProjectProgress = async (projectId) => {
  try {
    const tasks = await Task.find({ project: projectId });
    if (!tasks || tasks.length === 0) {
      await Project.findByIdAndUpdate(projectId, { completionPercentage: 0 });
      return;
    }
    const completedTasksCount = tasks.filter(t => t.status === 'completed').length;
    const progress = Math.round((completedTasksCount / tasks.length) * 100);
    await Project.findByIdAndUpdate(projectId, { completionPercentage: progress });
  } catch (err) {
    console.error('Error updating project progress:', err);
  }
};

exports.getTasks = async (req, res) => {
  try {
    const { projectId, status, priority, assignee, search, page = 1, limit = 20 } = req.query;
    let query = {};

    if (projectId) {
      query.project = projectId;
    } else if (req.user.role === 'team_member') {
      query.assignedTo = req.user._id;
    }
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignee) query.assignedTo = assignee;
    if (search) query.title = { $regex: search, $options: 'i' };

    const total = await Task.countDocuments(query);
    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name')
      .sort({ position: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: tasks,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name members owner');
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createTask = async (req, res) => {
  try {
    const { title, description, projectId, assignedTo, status, priority, deadline, estimatedHours, tags } = req.body;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const isOwner = project.owner.equals(req.user._id);
    const isMemberPM = project.members.some(m => m.user.equals(req.user._id) && m.role === 'project_manager');
    const isAdminOrPM = ['admin', 'project_manager'].includes(req.user.role);

    if (!isOwner && !isMemberPM && !isAdminOrPM) {
      return res.status(403).json({ success: false, message: 'Not authorized to create tasks in this project' });
    }

    const lastTask = await Task.findOne({ project: projectId, status: status || 'todo' }).sort({ position: -1 });
    const position = lastTask ? lastTask.position + 1 : 0;

    // Automatically link assignees to the project members
    if (assignedTo && assignedTo.length > 0) {
      let projectUpdated = false;
      for (const userId of assignedTo) {
        const isAlreadyMember = project.members.some(m => m.user && m.user.equals(userId)) || project.owner.equals(userId);
        if (!isAlreadyMember) {
          project.members.push({ user: userId, role: 'team_member' });
          projectUpdated = true;
        }
      }
      if (projectUpdated) {
        await project.save();
      }
    }

    const task = await Task.create({
      title, description, project: projectId,
      assignedTo: assignedTo || [],
      createdBy: req.user._id,
      status: status || 'todo',
      priority: priority || 'medium',
      deadline, estimatedHours, tags, position
    });

    await Activity.create({
      user: req.user._id,
      action: 'task_created',
      description: `Created task "${title}"`,
      project: projectId,
      task: task._id
    });

    if (assignedTo && assignedTo.length > 0) {
      for (const userId of assignedTo) {
        if (userId.toString() !== req.user._id.toString()) {
          await createNotification({
            recipient: userId,
            sender: req.user._id,
            type: 'task_assigned',
            title: 'New Task Assigned',
            message: `You have been assigned to task "${title}"`,
            relatedProject: projectId,
            relatedTask: task._id,
            link: `/projects/${projectId}/tasks/${task._id}`
          }, req.app.get('io'));
        }
      }
    }

    const populated = await task.populate([
      { path: 'assignedTo', select: 'name email avatar' },
      { path: 'createdBy', select: 'name email avatar' }
    ]);

    await updateProjectProgress(projectId);

    const io = req.app.get('io');
    io.to(`project_${projectId}`).emit('task_created', populated);

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const prevStatus = task.status;

    const project = await Project.findById(task.project);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const isOwner = project.owner.equals(req.user._id);
    const isMemberPM = project.members.some(m => m.user.equals(req.user._id) && m.role === 'project_manager');
    const isAdminOrPM = ['admin', 'project_manager'].includes(req.user.role);
    const isAssignee = task.assignedTo.some(id => id.equals(req.user._id));
    const isMember = project.members.some(m => m.user.equals(req.user._id));

    if (!isOwner && !isMemberPM && !isAdminOrPM && !isAssignee && !isMember) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this task' });
    }

    // Automatically link assignees to the project members
    if (req.body.assignedTo && req.body.assignedTo.length > 0) {
      let projectUpdated = false;
      for (const userId of req.body.assignedTo) {
        const isAlreadyMember = project.members.some(m => m.user && m.user.equals(userId)) || project.owner.equals(userId);
        if (!isAlreadyMember) {
          project.members.push({ user: userId, role: 'team_member' });
          projectUpdated = true;
        }
      }
      if (projectUpdated) {
        await project.save();
      }
    }

    if (req.body.status === 'completed' && prevStatus !== 'completed') {
      req.body.completedAt = new Date();
    } else if (req.body.status && req.body.status !== 'completed') {
      req.body.completedAt = null;
    }

    const updated = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true
    }).populate('assignedTo', 'name email avatar').populate('createdBy', 'name email avatar');

    await Activity.create({
      user: req.user._id,
      action: 'task_updated',
      description: `Updated task "${updated.title}"`,
      project: task.project,
      task: task._id,
      metadata: { changes: req.body }
    });

    if (req.body.status && req.body.status !== prevStatus) {
      await Activity.create({
        user: req.user._id,
        action: 'task_status_changed',
        description: `Changed task "${updated.title}" status from ${prevStatus} to ${req.body.status}`,
        project: task.project,
        task: task._id
      });

      if (req.body.status === 'completed') {
        for (const userId of task.assignedTo) {
          await createNotification({
            recipient: task.createdBy,
            sender: req.user._id,
            type: 'task_completed',
            title: 'Task Completed',
            message: `Task "${updated.title}" has been marked as completed`,
            relatedProject: task.project,
            relatedTask: task._id
          }, req.app.get('io'));
        }
      }
    }

    await updateProjectProgress(task.project);

    const io = req.app.get('io');
    io.to(`project_${task.project}`).emit('task_updated', updated);

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateTaskStatus = async (req, res) => {
  try {
    const { status, position } = req.body;
    const update = { status, position };
    if (status === 'completed') {
      update.completedAt = new Date();
    } else {
      update.completedAt = null;
    }
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    ).populate('assignedTo', 'name email avatar');

    await updateProjectProgress(task.project);

    const io = req.app.get('io');
    io.to(`project_${task.project}`).emit('task_moved', { taskId: task._id, status, position });

    res.json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const project = await Project.findById(task.project);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const isOwner = project.owner.equals(req.user._id);
    const isMemberPM = project.members.some(m => m.user.equals(req.user._id) && m.role === 'project_manager');
    const isAdminOrPM = ['admin', 'project_manager'].includes(req.user.role);

    if (!isOwner && !isMemberPM && !isAdminOrPM) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this task' });
    }

    await Task.findByIdAndDelete(req.params.id);
    await updateProjectProgress(task.project);

    const io = req.app.get('io');
    io.to(`project_${task.project}`).emit('task_deleted', { taskId: req.params.id });

    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getKanbanTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const tasks = await Task.find({ project: projectId })
      .populate('assignedTo', 'name email avatar')
      .sort({ position: 1, createdAt: 1 });

    const kanban = {
      todo: tasks.filter(t => t.status === 'todo'),
      in_progress: tasks.filter(t => t.status === 'in_progress'),
      review: tasks.filter(t => t.status === 'review'),
      completed: tasks.filter(t => t.status === 'completed')
    };

    res.json({ success: true, data: kanban });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.bulkUpdateTasks = async (req, res) => {
  try {
    const { taskIds, updates } = req.body;
    const tasks = await Task.find({ _id: { $in: taskIds } });
    const projectIds = [...new Set(tasks.map(t => t.project.toString()))];
    await Task.updateMany({ _id: { $in: taskIds } }, updates);
    for (const projectId of projectIds) {
      await updateProjectProgress(projectId);
    }
    res.json({ success: true, message: `${taskIds.length} tasks updated` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
