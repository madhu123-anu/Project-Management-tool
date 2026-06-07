const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getProjects, getProject, createProject, updateProject, deleteProject, archiveProject, addMember, removeMember, getDashboardStats } = require('../controllers/projectController');

router.use(protect);
router.get('/stats/dashboard', getDashboardStats);
router.get('/', getProjects);
router.post('/', authorize('admin', 'project_manager'), createProject);
router.get('/:id', getProject);
router.put('/:id', updateProject);
router.delete('/:id', authorize('admin', 'project_manager'), deleteProject);
router.put('/:id/archive', archiveProject);
router.post('/:id/members', addMember);
router.delete('/:id/members/:userId', removeMember);

module.exports = router;
