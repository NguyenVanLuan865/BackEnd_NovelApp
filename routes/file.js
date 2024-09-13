// routes/textRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const textController = require('../controllers/textController');

// Cấu hình multer để upload file
const upload = multer({ dest: 'uploads/' });

// POST route: Upload file
router.post('/upload', upload.single('file'), textController.uploadTextFile);

// GET route: Lấy nội dung của một file text theo ID
router.get('/getcontentbyid/:id', textController.getTextFileById);

module.exports = router;
