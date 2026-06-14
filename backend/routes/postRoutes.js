const express = require('express');
const {
  createPost,
  getPosts,
  likePost,
  commentPost,
  replyCommentPost,
  updatePost,
  deletePost,
  promotePost,
  votePoll,
} = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// Public routes: read feed
router.get('/', getPosts);

// Protected routes: require auth token
router.post('/', protect, upload.single('image'), createPost);
router.put('/:id', protect, upload.single('image'), updatePost);
router.delete('/:id', protect, deletePost);
router.put('/:id/promote', protect, promotePost);
router.post('/:id/vote', protect, votePoll);
router.post('/:id/like', protect, likePost);
router.post('/:id/comment', protect, commentPost);
router.post('/:id/comment/:commentId/reply', protect, replyCommentPost);

module.exports = router;
