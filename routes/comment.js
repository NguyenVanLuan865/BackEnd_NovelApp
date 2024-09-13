const express = require('express');
const router = express.Router();
const multer = require('multer');
const commentController = require('../controllers/commentController');

// Lấy tất cả comment của một truyện (bao gồm cả reply)
router.get('/novels/:novelId/comments', commentController.getAllCommentsByNovelId);

// Lấy một comment cụ thể và các reply của nó
router.get('/comments/:commentId', commentController.getCommentById);

// Đăng một bình luận mới
router.post('/comments', commentController.postComment);

// Đăng một reply cho một comment
router.post('/comments/reply', commentController.postReply);



module.exports = router;
