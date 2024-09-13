const express = require("express");
const userController = require("../controllers/userController");

const router = express.Router();
//Đăng kí user
router.post("/register", userController.RegisterUser);

//Đăng nhập User
router.post("/login", userController.LoginUser);

// Route gửi mã xác nhận quên mật khẩu
router.post('/forgot-password', userController.ForgotPassword);

//Cập nhật vị trí đọc
router.post('/updateReadingProgress', userController.updateReadingProgress);

//Lấy truyện đang đọc
router.get('/readingHistory/:userId', userController.getUserReadingHistoryWithNovels);

module.exports = router;
