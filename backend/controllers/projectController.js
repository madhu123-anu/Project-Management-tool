const Project = require('../models/Project');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const { createNotification } = require('../utils/notifications');

exports.getProjects = async (req, res) => {
  try {
    const { status, priority, search, page = 1, limit = 10 } = req.query;
    let query = {};

    if (req.user.role !== 'admin') {
      query.$or = [
        { owner: req.user._id },
        { 'members.user': req.user._id }
      ];
    }
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (search) query.name = { $regex: search, $options: 'i' };
    query.isArchived = false;

    const total = await Project.countDocuments(query);
    const projects = await Project.find(query)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: projects,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar role')
      .populate('members.user', 'name email avatar role');
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const hasAccess = req.user.role === 'admin' ||
      project.owner.equals(req.user._id) ||
      project.members.some(m => m.user._id.equals(req.user._id));

    if (!hasAccess) return res.status(403).json({ success: false, message: 'Access denied' });

    const taskStats = await Task.aggregate([
      { $match: { project: project._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    res.json({ success: true, data: project, taskStats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createProject = async (req, res) => {
  try {
    const { name, description, clientName, startDate, endDate, priority, members } = req.body;
    const project = await Project.create({
      name, description, clientName, startDate, endDate, priority,
      owner: req.user._id,
      members: members ? members.map(id => ({ user: id })) : [],
      status: 'planning'
    });

    await Activity.create({
      user: req.user._id,
      action: 'project_created',
      description: `Created project "${name}"`,
      project: project._id
    });

    const populated = await project.populate('owner', 'name email avatar');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const canEdit = req.user.role === 'admin' || project.owner.equals(req.user._id) ||
      project.members.some(m => m.user.equals(req.user._id) && m.role === 'project_manager');
    if (!canEdit) return res.status(403).json({ success: false, message: 'Not authorized' });

    const updated = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true
    }).populate('owner', 'name email avatar').populate('members.user', 'name email avatar');

    await Activity.create({
      user: req.user._id,
      action: 'project_updated',
      description: `Updated project "${updated.name}"`,
      project: project._id
    });

    const io = req.app.get('io');
    io.to(`project_${req.params.id}`).emit('project_updated', updated);

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    if (req.user.role !== 'admin' && !project.owner.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await Task.deleteMany({ project: req.params.id });
    await Project.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.archiveProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { isArchived: true, status: 'archived' },
      { new: true }
    );
    res.json({ success: true, data: project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addMember = async (req, res) => {
  try {
    const { userId, role = 'team_member' } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const alreadyMember = project.members.some(m => m.user.equals(userId));
    if (alreadyMember) return res.status(400).json({ success: false, message: 'User already a member' });

    project.members.push({ user: userId, role });
    await project.save();

    await createNotification({
      recipient: userId,
      sender: req.user._id,
      type: 'member_added',
      title: 'Added to Project',
      message: `You were added to project "${project.name}"`,
      relatedProject: project._id
    }, req.app.get('io'));

    const updated = await Project.findById(req.params.id).populate('members.user', 'name email avatar');
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    project.members = project.members.filter(m => !m.user.equals(req.params.userId));
    await project.save();
    res.json({ success: true, message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    let projectQuery = {};
    if (req.user.role !== 'admin') {
      projectQuery.$or = [{ owner: req.user._id }, { 'members.user': req.user._id }];
    }

    const [totalProjects, activeProjects, completedProjects, projects] = await Promise.all([
      Project.countDocuments({ ...projectQuery, isArchived: false }),
      Project.countDocuments({ ...projectQuery, status: 'active', isArchived: false }),
      Project.countDocuments({ ...projectQuery, status: 'completed', isArchived: false }),
      Project.find({ ...projectQuery, isArchived: false }, '_id')
    ]);

    const projectIds = projects.map(p => p._id);

    let taskQuery = { project: { $in: projectIds } };
    if (req.user.role === 'team_member') taskQuery.assignedTo = req.user._id;

    const [pendingTasks, overdueTasks, totalTasks, completedTasks, tasksByStatus] = await Promise.all([
      Task.countDocuments({ ...taskQuery, status: { $ne: 'completed' } }),
      Task.countDocuments({ ...taskQuery, status: { $ne: 'completed' }, deadline: { $lt: new Date() } }),
      Task.countDocuments(taskQuery),
      Task.countDocuments({ ...taskQuery, status: 'completed' }),
      Task.aggregate([
        { $match: taskQuery },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    const monthlyData = await Task.aggregate([
      { $match: { ...taskQuery, createdAt: { $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, status: '$status' }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        totalProjects, activeProjects, completedProjects,
        pendingTasks, overdueTasks, totalTasks, completedTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        tasksByStatus, monthlyData
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
