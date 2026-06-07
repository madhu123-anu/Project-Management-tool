// routes/comments.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getComments, createComment, updateComment, deleteComment } = require('../controllers/commentController');
router.use(protect);
router.get('/', getComments);
router.post('/', createComment);
router.put('/:id', updateComment);
router.delete('/:id', deleteComment);
module.exports = router;
