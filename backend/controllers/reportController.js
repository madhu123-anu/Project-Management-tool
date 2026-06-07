const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const Activity = require('../models/Activity');

exports.getProjectReport = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId).populate('members.user', 'name email avatar').populate('owner', 'name email');
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const tasks = await Task.find({ project: projectId }).populate('assignedTo', 'name email');
    const tasksByStatus = { todo: 0, in_progress: 0, review: 0, completed: 0 };
    const tasksByPriority = { low: 0, medium: 0, high: 0, critical: 0 };

    tasks.forEach(task => {
      tasksByStatus[task.status] = (tasksByStatus[task.status] || 0) + 1;
      tasksByPriority[task.priority] = (tasksByPriority[task.priority] || 0) + 1;
    });

    const overdueTasks = tasks.filter(t => t.deadline && t.deadline < new Date() && t.status !== 'completed');
    const completionRate = tasks.length > 0 ? Math.round((tasksByStatus.completed / tasks.length) * 100) : 0;

    res.json({
      success: true,
      data: { project, tasks, tasksByStatus, tasksByPriority, overdueTasks, completionRate, totalTasks: tasks.length }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getTeamReport = async (req, res) => {
  try {
    const users = await User.find({ isActive: true }).select('name email avatar role');
    const teamStats = await Promise.all(users.map(async (user) => {
      const [assigned, completed, overdue] = await Promise.all([
        Task.countDocuments({ assignedTo: user._id }),
        Task.countDocuments({ assignedTo: user._id, status: 'completed' }),
        Task.countDocuments({ assignedTo: user._id, status: { $ne: 'completed' }, deadline: { $lt: new Date() } })
      ]);
      return { user, assigned, completed, overdue, completionRate: assigned > 0 ? Math.round((completed / assigned) * 100) : 0 };
    }));
    res.json({ success: true, data: teamStats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getProductivityReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const dailyCompletions = await Task.aggregate([
      { $match: { completedAt: { $gte: start, $lte: end } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const dailyCreations = await Task.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    res.json({ success: true, data: { dailyCompletions, dailyCreations, period: { start, end } } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getDeadlineReport = async (req, res) => {
  try {
    const now = new Date();
    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [overdue, dueThisWeek, dueThisMonth] = await Promise.all([
      Task.find({ deadline: { $lt: now }, status: { $ne: 'completed' } }).populate('assignedTo', 'name email').populate('project', 'name'),
      Task.find({ deadline: { $gte: now, $lte: next7Days }, status: { $ne: 'completed' } }).populate('assignedTo', 'name email').populate('project', 'name'),
      Task.find({ deadline: { $gte: next7Days, $lte: next30Days }, status: { $ne: 'completed' } }).populate('assignedTo', 'name email').populate('project', 'name')
    ]);

    res.json({ success: true, data: { overdue, dueThisWeek, dueThisMonth } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
