// routes/chapterRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const chapterController = require('../controllers/chapterController');

// Cấu hình multer để lưu file tạm thời
const upload = multer({ dest: 'uploads/' });

// POST route: Upload chapter
router.post('/upload', upload.single('file'), chapterController.uploadChapter);

// POST route: Upload multiple chapters
router.post('/uploadMultiple', upload.array('files'), chapterController.uploadMultipleChapters);


// Define a route to get all chapters of a novel using the chapter ID
router.get('/novel/:id', chapterController.getChaptersByNovel);

// GET route: Lấy nội dung của một chapter theo ID
router.get('/:id', chapterController.getChapterById);


module.exports = router;
