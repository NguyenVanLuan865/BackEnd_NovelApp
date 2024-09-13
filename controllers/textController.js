// controllers/textController.js
const fs = require('fs');
const { File } = require('../model/model');

// POST: Upload file và lưu nội dung vào MongoDB dưới dạng byte (base64)
exports.uploadTextFile = async (req, res) => {
  try {
    const { originalname, path: filePath } = req.file;

    // Kiểm tra xem file đã tồn tại hay chưa
    const existingFile = await File.findOne({ filename: originalname });
    if (existingFile) {
      // Xóa file tạm thời sau khi kiểm tra
      fs.unlinkSync(filePath);
      return res.status(400).json({ message: "File đã tồn tại" });
    }

    // Đọc nội dung file dưới dạng buffer và chuyển thành base64
    const contentBuffer = fs.readFileSync(filePath);
    const contentBase64 = contentBuffer.toString('base64');
    console.log("Base64 Content:", contentBase64);
    // Lưu file vào MongoDB
    const newFile = new File({
      filename: originalname,
      content: contentBase64,
    });

    await newFile.save();

    // Xóa file sau khi đọc xong
    fs.unlinkSync(filePath);

    res.status(201).json({ message: "File đã được tải lên và lưu trữ", file: newFile });
  } catch (error) {
    res.status(500).json({ message: "Có lỗi xảy ra", error: error.message });
  }
};

// GET: Lấy nội dung của một file text theo ID
exports.getTextFileById = async (req, res) => {
  try {
    const { id } = req.params;

    // Tìm file theo _id
    const file = await File.findById(id);
    if (!file) {
      return res.status(404).json({ message: "File không tồn tại" });
    }

    // Chuyển đổi nội dung từ base64 về buffer nếu cần thiết
    res.status(200).json({
      filename: file.filename,
      content: file.content, // Nếu cần trả lại dưới dạng base64
    });
  } catch (error) {
    res.status(500).json({ message: "Có lỗi xảy ra", error: error.message });
  }
};
