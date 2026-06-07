const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getUsers, getUser, updateUser, deleteUser, getUserStats, createUser } = require('../controllers/userController');

router.use(protect);
router.get('/', getUsers);
router.post('/', authorize('admin', 'project_manager'), createUser);
router.get('/:id', getUser);
router.get('/:id/stats', getUserStats);
router.put('/:id', authorize('admin'), updateUser);
router.delete('/:id', authorize('admin'), deleteUser);

module.exports = router;
