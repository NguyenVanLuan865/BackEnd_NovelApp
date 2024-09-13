const express = require("express");
const router = express.Router();
const multer = require("multer");
const novelController = require("../controllers/novelController");

// Cấu hình multer để lưu file tạm thời trên đĩa
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Đảm bảo thư mục này tồn tại hoặc thay đổi theo nhu cầu của bạn
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage: storage });

// Route để thêm novel mới với file upload
router.post("/novels", upload.single('file'), novelController.addNovel);

// Route để lấy danh sách tất cả novels
router.get("/novels", novelController.getNovels);

// Route để lấy ngẫu nhiên 10 truyện Huyền Huyễn
router.get('/novels/huyenhuyen/random', novelController.getRandomHuyenHuyenNovels);

// Route để lấy ngẫu nhiên 10 truyện Tiên Hiệp
router.get('/novels/tienhiep/random', novelController.getRandomTienHiepNovels);

// Route để lấy 10 truyện có thời gian cập nhật sớm nhất
router.get('/novels/latest-random', novelController.getRandomLatestNovels);

// Route để lấy truyện cho trang chủ
router.get('/novels/novelforhome', novelController.getNovelsForHomeScreen);

// Route để lấy thông tin của một novel theo id
router.get("/novels/:id", novelController.getNovelById);

// Route để cập nhật trường progress cho tất cả novels
router.patch("/novels/update-progress", novelController.updateAllNovelsProgress);

// ROute để search
router.get('/search', novelController.searchNovelsByNameOrAuthor);

// Route để xóa tất cả novels
router.delete("/novels", novelController.deleteAllNovels);

// Route để xóa novel theo ID
router.delete("/novels/:id", novelController.deleteNovelById);

// Route để lấy danh sách chapter của novels theo ID
router.get('/chapters/novel/:id', novelController.getListChapterOfNovelById);

// Route để cập nhật trường progress cho một novel theo ID
router.patch("/novels/:id/update-progress", novelController.updateNovelProgressById);


module.exports = router;
