// routes/tasks.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getTasks, getTask, createTask, updateTask, updateTaskStatus, deleteTask, getKanbanTasks, bulkUpdateTasks } = require('../controllers/taskController');

router.use(protect);
router.get('/', getTasks);
router.post('/', createTask);
router.get('/kanban/:projectId', getKanbanTasks);
router.get('/:id', getTask);
router.put('/:id', updateTask);
router.patch('/:id/status', updateTaskStatus);
router.delete('/:id', deleteTask);
router.post('/bulk', bulkUpdateTasks);

module.exports = router;
