const fs = require('fs');
const { Chapter, Novel } = require("../model/model");

//UPLOAD CHAPTER
exports.uploadChapter = async (req, res) => {
  try {
    const { title, novelId } = req.body;
    const { path: filePath } = req.file;

    const novel = await Novel.findById(novelId);
    if (!novel) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ message: "Tiểu thuyết không tồn tại" });
    }

    const content = fs.readFileSync(filePath, 'utf-8');

    const chapterCount = novel.chapters.length;
    const newChapterNumber = chapterCount + 1;

    const newChapter = new Chapter({
      title,
      number: newChapterNumber,
      content, 
      novelId,
    });

    await newChapter.save();

    novel.chapters.push(newChapter._id);
    await novel.save();

    fs.unlinkSync(filePath);

    res.status(201).json({ message: "Chương đã được tải lên và lưu trữ", chapter: newChapter });
  } catch (error) {
    res.status(500).json({ message: "Có lỗi xảy ra", error: error.message });
  }
};

//UPLOAD MULLTIPLE CHAPTER
exports.uploadMultipleChapters = async (req, res) => {
  try {
    const { novelId } = req.body;
    const files = req.files; 

    const novel = await Novel.findById(novelId);
    if (!novel) {
      files.forEach(file => fs.unlinkSync(file.path)); 
      return res.status(400).json({ message: "Tiểu thuyết không tồn tại" });
    }

    const chapterCount = await Chapter.countDocuments({ novelId });

    for (const [index, file] of files.entries()) {
      const { path: filePath, originalname } = file;

      const baseName = originalname.replace('.txt', '');

      const content = fs.readFileSync(filePath, 'utf-8');

      const title = baseName.split(/[:\-]/).slice(1).join('-').trim();
      const newChapterNumber = chapterCount + index + 1;

      if (!title) {
        fs.unlinkSync(filePath);
        return res.status(400).json({ message: `Tên file không hợp lệ: ${originalname}` });
      }

      const newChapter = new Chapter({
        title,
        number: newChapterNumber,
        content,
        novelId,
      });

      await newChapter.save();
      novel.chapters.push(newChapter._id);
      fs.unlinkSync(filePath);
    }

    await novel.save();

    res.status(201).json({ message: "Các chương đã được tải lên và lưu trữ" });
  } catch (error) {
    res.status(500).json({ message: "Có lỗi xảy ra", error: error.message });
  }
};


//GET CHAPTER
exports.getChapterById = async (req, res) => {
  try {
    const { id } = req.params;

    const chapter = await Chapter.findById(id).select('novelId number title content');
    if (!chapter) {
      return res.status(404).json({ message: "Chương không tồn tại" });
    }
    const previousChapter = await Chapter.findOne({
      novelId: chapter.novelId,
      number: { $lt: chapter.number }
    }).sort({ number: -1 }).select('_id number title');

    const nextChapter = await Chapter.findOne({
      novelId: chapter.novelId,
      number: { $gt: chapter.number }
    }).sort({ number: 1 }).select('_id number title');

    res.status(200).json({
      number: chapter.number,
      title: chapter.title,
      content: chapter.content,
      previousChapter: {
        id: previousChapter ? previousChapter._id : null,
        number: previousChapter ? previousChapter.number : null,
        title: previousChapter ? previousChapter.title : null
      },
      nextChapter: {
        id: nextChapter ? nextChapter._id : null,
        number: nextChapter ? nextChapter.number : null,
        title: nextChapter ? nextChapter.title : null
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Có lỗi xảy ra", error: error.message });
  }
};


//GET LIST CHAPTER BY ID 
exports.getChaptersByNovel = async (req, res) => {
  try {
    const { id } = req.params;

    const chapter = await Chapter.findById(id).select('novelId');
    if (!chapter) {
      return res.status(404).json({ message: "Chương không tồn tại" });
    }

    const chapters = await Chapter.find({ novelId: chapter.novelId })
      .select('chapterNumber chapterTitle _id updatedAt');

    if (chapters.length === 0) {
      return res.status(404).json({ message: "Không có chương nào thuộc truyện này" });
    }

    res.status(200).json(chapters);
  } catch (error) {
    res.status(500).json({ message: "Có lỗi xảy ra", error: error.message });
  }
};
