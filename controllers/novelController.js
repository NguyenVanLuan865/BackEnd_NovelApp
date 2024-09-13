const {
  Novel,
  Author,
  Comment,
  HuyenHuyenNovel,
  TienHiepNovel,
  HiepKhachNovel,
  DongNhanNovel,
  HeThongNovel,
  NgonTinhNovel,
  KhoaHuyenNovel,
  HaiHuocNovel,
  DiNangNovel,
  TrongSinhNovel,
  VongDuNovel
} = require("../model/model");
const fs = require('fs');

// ADD NOVEL
exports.addNovel = async (req, res) => {
  try {
    const { name, genres, authorName, description } = req.body;
    const { path: filePath } = req.file;

    let genresArray = Array.isArray(genres) ? genres : genres.split(',').map(Number);

    if (!Array.isArray(genresArray) || !genresArray.every(item => typeof item === 'number')) {
      return res.status(400).json({ message: "Genres phải là mảng các số" });
    }

    let author = await Author.findOne({ name: authorName });

    if (!author) {
      author = new Author({ name: authorName });
      await author.save();
    }

    const contentBuffer = fs.readFileSync(filePath);
    const contentBase64 = contentBuffer.toString('base64');

    fs.unlinkSync(filePath);

    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];

    let existingNovel = await Novel.findOne({ name });
    let newNovel;

    if (existingNovel) {
      existingNovel = await Novel.findOneAndUpdate(
        { name },
        {
          $set: {
            publishedDate: formattedDate,
            genres: genresArray,
            author: author._id,
            imageNovel: contentBase64,
            description,
          }
        },
        { new: true }
      );
      newNovel = existingNovel;
    } else {
      newNovel = new Novel({
        name,
        publishedDate: formattedDate,
        genres: genresArray,
        author: author._id,
        imageNovel: contentBase64,
        description,
      });

      await newNovel.save();
    }

    if (!author.novel.includes(newNovel._id)) {
      author.novel.push(newNovel._id);
      await author.save();
    }

    const genreCollections = {
      1: HuyenHuyenNovel,
      2: TienHiepNovel,
      3: HiepKhachNovel,
      4: DongNhanNovel,
      5: HeThongNovel,
      6: NgonTinhNovel,
      7: KhoaHuyenNovel,
      8: HaiHuocNovel,
      9: DiNangNovel,
      10: TrongSinhNovel,
      11: VongDuNovel,
    };

    for (const genre of genresArray) {
      const GenreModel = genreCollections[genre];
      if (GenreModel) {
        const newGenreNovel = new GenreModel({
          novelId: newNovel._id,
          name: newNovel.name,
        });
        await newGenreNovel.save();
      }
    }

    res.status(201).json({
      message: "Novel và tác giả đã được tải lên thành công",
      novel: newNovel,
      author: author,
    });
  } catch (error) {
    res.status(500).json({
      message: "Có lỗi xảy ra khi tải lên novel",
      error: error.message,
    });
  }
};

// GET ALL NOVEL
exports.getNovels = async (req, res) => {
  try {

    const [novels, totalCount] = await Promise.all([
      Novel.find().populate("author", "name year"),
      Novel.countDocuments() 
    ]);

    res.status(200).json({
      message: "Danh sách novels",
      totalCount, 
      novels,     
    });
  } catch (error) {
    res.status(500).json({
      message: "Có lỗi xảy ra khi lấy danh sách novels",
      error: error.message,
    });
  }
};


exports.getNovelById = async (req, res) => {
  try {
    const { id } = req.params;

    const novel = await Novel.findById(id)
      .populate({
        path: "author",
        select: "name image" /iả
      })
      .populate("chapters");

    if (!novel) {
      return res.status(404).json({ message: "Novel không tồn tại" });
    }

    const totalChapters = novel.chapters.length;
    const firstChapter = novel.chapters.length > 0 ? novel.chapters[0] : null;

    const comments = await Comment.find({ novelId: id, parentComment: null })
      .sort({ createdAt: -1 }) 
      .limit(5) 
      .populate('userId', 'username');

    const commentsWithReplyCount = await Promise.all(
      comments.map(async (comment) => {
        const replyCount = await Comment.countDocuments({ parentComment: comment._id });

        return {
          content: comment.content,
          userId: comment.userId,
          replyCount: replyCount
        };
      })
    );

    const authorId = novel.author._id; 
    let authorNovels = [];

    if (authorId) {
      authorNovels = await Novel.find({ author: authorId })
        .select('name imageNovel') 
        .lean();
    }

    res.status(200).json({
      message: "Thông tin novel",
      novel: {
        novelName: novel.name,
        imageNovel: novel.imageNovel,
      },
      author: {
        authorName: novel.author.name,
        authorImage: novel.author.image,
        novels: authorNovels.map(novel => ({
          novelId: novel._id,
          name: novel.name, 
          imageNovel: novel.imageNovel ,
          description: ""
        }))
      },
      totalChapters: totalChapters,
      chapters: firstChapter
        ? [{
          chapterNumber: 1,
          id: firstChapter._id,
        }]
        : [],
      publishedDate: novel.publishedDate,
      genres: novel.genres,
      rating: novel.rating,
      imageNovel: novel.imageNovel,
      description: novel.description,
      progress: novel.progress,
      comments: commentsWithReplyCount, 
    });
  } catch (error) {
    res.status(500).json({
      message: "Có lỗi xảy ra khi lấy thông tin novel",
      error: error.message,
    });
  }
};




//GET LIST CHAPTER OF NOVEL
const formatDate = (isoDate) => {
  const date = new Date(isoDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

exports.getListChapterOfNovelById = async (req, res) => {
  try {
    const { id } = req.params;

    const novel = await Novel.findById(id)
      .populate("chapters"); 

    if (!novel) {
      return res.status(404).json({ message: "Novel không tồn tại" });
    }
    const totalChapters = novel.chapters.length;

    res.status(200).json({
      message: "Thông tin list chapter novel",
      totalChapters: totalChapters,
      chapters: novel.chapters.map((chapter, index) => ({
        chapterNumber: index + 1,
        chapterTitle: chapter.title,
        id: chapter._id,
        updatedAt: formatDate(chapter.updatedAt), 
      })),
    });
  } catch (error) {
    res.status(500).json({
      message: "Có lỗi xảy ra khi lấy thông tin novel",
      error: error.message,
    });
  }
};

// GET RANDOM 10 HUYENHUYEN NOVELS
exports.getRandomHuyenHuyenNovels = async (req, res) => {
  try {
    // Lấy ngẫu nhiên 10 truyện Huyền Huyễn
    const randomNovels = await HuyenHuyenNovel.aggregate([
      { $sample: { size: 10 } },
      {
        $lookup: {
          from: "novels",
          localField: "novelId",
          foreignField: "_id",
          as: "novelInfo"
        }
      },
      {
        $unwind: "$novelInfo"
      },
      {
        $project: {
          _id: 0,
          novelId: "$novelInfo._id",
          name: "$novelInfo.name",
          imageNovel: "$novelInfo.imageNovel"
        }
      }
    ]);

    // Trả về danh sách ngẫu nhiên 10 truyện
    res.status(200).json({
      message: "10 truyện Huyền Huyễn ngẫu nhiên",
      novels: randomNovels,
    });
  } catch (error) {
    res.status(500).json({
      message: "Có lỗi xảy ra khi lấy truyện Huyền Huyễn ngẫu nhiên",
      error: error.message,
    });
  }
};

exports.getRandomTienHiepNovels = async (req, res) => {
  try {

    const randomNovels = await TienHiepNovel.aggregate([
      { $sample: { size: 10 } },
      {
        $lookup: {
          from: "novels",
          localField: "novelId",
          foreignField: "_id",
          as: "novelInfo"
        }
      },
      {
        $unwind: "$novelInfo"
      },
      {
        $project: {
          _id: 0,
          novelId: "$novelInfo._id",
          name: "$novelInfo.name",
          imageNovel: "$novelInfo.imageNovel"
        }
      }
    ]);

    res.status(200).json({
      message: "10 truyện Huyền Huyễn ngẫu nhiên",
      novels: randomNovels,
    });
  } catch (error) {
    res.status(500).json({
      message: "Có lỗi xảy ra khi lấy truyện Huyền Huyễn ngẫu nhiên",
      error: error.message,
    });
  }
};

// GET 10 LATEST NOVELS
exports.getRandomLatestNovels = async (req, res) => {
  try {

    const latestNovels = await Novel.aggregate([
      {
        $addFields: {
          publishedDate: {
            $dateFromString: { dateString: "$publishedDate" }
          }
        }
      },
      { $sort: { publishedDate: -1 } },
      { $limit: 8 },
      {
        $lookup: {
          from: "authors",
          localField: "author",
          foreignField: "_id",
          as: "authorInfo"
        }
      },
      {
        $unwind: "$authorInfo"
      },
      {
        $project: {
          _id: 1,
          name: 1,
          imageNovel: 1,
        }
      }
    ]);

    res.status(200).json({
      message: "Danh sách 10 truyện cập nhật mới nhất",
      novels: latestNovels,
    });
  } catch (error) {
    res.status(500).json({
      message: "Có lỗi xảy ra khi lấy danh sách truyện cập nhật mới nhất",
      error: error.message,
    });
  }
};

//GET NOVEL FOR HOMESCREEN
exports.getNovelsForHomeScreen = async (req, res) => {
  try {
    const [randomHuyenHuyenNovels, randomTienHiepNovels, latestNovels] = await Promise.all([
      HuyenHuyenNovel.aggregate([
        { $sample: { size: 12 } },
        {
          $lookup: {
            from: "novels",
            localField: "novelId",
            foreignField: "_id",
            as: "novelInfo"
          }
        },
        { $unwind: "$novelInfo" },
        {
          $project: {
            _id: 0,
            novelId: "$novelInfo._id",
            name: "$novelInfo.name",
            description: "$novelInfo.description",
            imageNovel: "$novelInfo.imageNovel"
          }
        }
      ]),

      TienHiepNovel.aggregate([
        { $sample: { size: 12 } },
        {
          $lookup: {
            from: "novels",
            localField: "novelId",
            foreignField: "_id",
            as: "novelInfo"
          }
        },
        { $unwind: "$novelInfo" },
        {
          $project: {
            _id: 0,
            novelId: "$novelInfo._id",
            name: "$novelInfo.name",
            description: "$novelInfo.description",
            imageNovel: "$novelInfo.imageNovel"
          }
        }
      ]),

      Novel.aggregate([
        {
          $addFields: {
            publishedDate: {
              $dateFromString: { dateString: "$publishedDate" }
            }
          }
        },
        { $sort: { publishedDate: -1 } },
        { $limit: 8 },
        {
          $lookup: {
            from: "authors",
            localField: "author",
            foreignField: "_id",
            as: "authorInfo"
          }
        },
        { $unwind: "$authorInfo" },
        {
          $project: {
            novelId: 1,
            name: 1,
            imageNovel: 1,
          }
        }
      ])
    ]);

    res.status(200).json({
      message: "Thông tin truyện",
      huyenHuyenNovels: randomHuyenHuyenNovels,
      tienHiepNovels: randomTienHiepNovels,
      latestNovels: latestNovels,
    });
  } catch (error) {
    res.status(500).json({
      message: "Có lỗi xảy ra khi lấy thông tin truyện",
      error: error.message,
    });
  }
};


// DELETE ALL NOVELS
exports.deleteAllNovels = async (req, res) => {
  try {
    const novels = await Novel.find({}, "_id");

    const novelIds = novels.map(novel => novel._id);

    await Novel.deleteMany();

    await Promise.all([
      HuyenHuyenNovel.deleteMany({ novelId: { $in: novelIds } }),
      TienHiepNovel.deleteMany({ novelId: { $in: novelIds } }),
      HiepKhachNovel.deleteMany({ novelId: { $in: novelIds } }),
      DongNhanNovel.deleteMany({ novelId: { $in: novelIds } }),
      HeThongNovel.deleteMany({ novelId: { $in: novelIds } }),
      NgonTinhNovel.deleteMany({ novelId: { $in: novelIds } }),
      KhoaHuyenNovel.deleteMany({ novelId: { $in: novelIds } }),
      HaiHuocNovel.deleteMany({ novelId: { $in: novelIds } }),
      DiNangNovel.deleteMany({ novelId: { $in: novelIds } }),
      TrongSinhNovel.deleteMany({ novelId: { $in: novelIds } }),
      VongDuNovel.deleteMany({ novelId: { $in: novelIds } }),
    ]);

    await Author.updateMany({}, { $pull: { novel: { $in: novelIds } } });

    res.status(200).json({ message: "Đã xóa tất cả novels và liên quan" });
  } catch (error) {
    res.status(500).json({
      message: "Có lỗi xảy ra khi xóa tất cả novels và liên quan",
      error: error.message,
    });
  }
};

// DELETE A NOVEL
exports.deleteNovelById = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedNovel = await Novel.findByIdAndDelete(id);

    if (!deletedNovel) {
      return res.status(404).json({ message: "Novel không tồn tại" });
    }

    await Author.updateMany({}, { $pull: { novel: id } });

    await Promise.all([
      HuyenHuyenNovel.deleteMany({ novelId: id }),
      TienHiepNovel.deleteMany({ novelId: id }),
      HiepKhachNovel.deleteMany({ novelId: id }),
      DongNhanNovel.deleteMany({ novelId: id }),
      HeThongNovel.deleteMany({ novelId: id }),
      NgonTinhNovel.deleteMany({ novelId: id }),
      KhoaHuyenNovel.deleteMany({ novelId: id }),
      HaiHuocNovel.deleteMany({ novelId: id }),
      DiNangNovel.deleteMany({ novelId: id }),
      TrongSinhNovel.deleteMany({ novelId: id }),
      VongDuNovel.deleteMany({ novelId: id }),
    ]);

    res.status(200).json({ message: "Đã xóa novel và liên quan" });
  } catch (error) {
    res.status(500).json({
      message: "Có lỗi xảy ra khi xóa novel",
      error: error.message,
    });
  }
};

exports.updateAllNovelsProgress = async (req, res) => {
  try {
    const result = await Novel.updateMany({}, { $set: { progress: true } });

    res.status(200).json({
      message: "Cập nhật thành công",
      modifiedCount: result.nModified, 
    });
  } catch (error) {
    res.status(500).json({
      message: "Có lỗi xảy ra khi cập nhật các novel",
      error: error.message,
    });
  }
};

exports.updateNovelProgressById = async (req, res) => {
  try {
    const { id } = req.params;
    const { progress } = req.body; 
    const updatedNovel = await Novel.findByIdAndUpdate(
      id,
      { $set: { progress } },
      { new: true, runValidators: true } 
    );

    if (!updatedNovel) {
      return res.status(404).json({ message: "Novel không tồn tại" });
    }

    res.status(200).json({
      message: "Cập nhật thành công",
      novel: updatedNovel,
    });
  } catch (error) {
    res.status(500).json({
      message: "Có lỗi xảy ra khi cập nhật novel",
      error: error.message,
    });
  }
};

// Chức nắng SEARCH
const createVietnameseRegex = (query) => {
  const vietnameseMap = {
      a: '[aáàảãạâấầẩẫậăắằẳẵặ]',
      A: '[AÁÀẢÃẠÂẤẦẨẪẬĂẮẰẲẴẶ]',
      e: '[eéèẻẽẹêếềểễệ]',
      E: '[EÉÈẺẼẸÊẾỀỂỄỆ]',
      i: '[iíìỉĩị]',
      I: '[IÍÌỈĨỊ]',
      o: '[oóòỏõọôốồổỗộơớờởỡợ]',
      O: '[OÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢ]',
      u: '[uúùủũụưứừửữự]',
      U: '[UÚÙỦŨỤƯỨỪỬỮỰ]',
      y: '[yýỳỷỹỵ]',
      Y: '[YÝỲỶỸỴ]',
      d: '[dđ]',
      D: '[DĐ]',
  };
  return query.split('').map(char => vietnameseMap[char] || char).join('');
};

exports.searchNovelsByNameOrAuthor = async (req, res) => {
  try {
    const { query, genres } = req.query;
    if (!query && !genres) {
      return res.status(400).json({ message: "Query và thể loại không được để trống cùng lúc" });
    }

    let searchConditions = [];

    if (query) {
      const vietnameseRegex = new RegExp(createVietnameseRegex(query), 'i');
      searchConditions.push({
        $or: [
          { name: { $regex: vietnameseRegex } },
          {
            author: {
              $in: (await Author.find({
                name: { $regex: vietnameseRegex }
              }).distinct('_id'))
            }
          }
        ]
      });
    }

    if (genres) {
      searchConditions.push({ genres: { $in: [genres] } });
    }

    const novels = await Novel.aggregate([
      {
        $match: {
          $and: searchConditions
        }
      },
      {
        $lookup: {
          from: 'authors',
          localField: 'author',
          foreignField: '_id',
          as: 'authorDetails'
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          imageNovel: 1,
          authorDetails: { $arrayElemAt: ['$authorDetails', 0] }
        }
      }
    ]);

    if (novels.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy truyện hoặc tác giả nào" });
    }

    res.status(200).json({
      message: "Kết quả tìm kiếm",
      novels: novels.map(novel => ({
        novelId: novel._id,
        novelName: novel.name,
        publishedDate: novel.publishedDate,
        genres: novel.genres,
        chapters: novel.chapters,
        rating: novel.rating,
        imageNovel: novel.imageNovel,
        description: novel.description,
        progress: novel.progress,
        authorName: novel.authorDetails ? novel.authorDetails.name : 'Chưa có tác giả'
      }))
    });
  } catch (error) {
    res.status(500).json({
      message: "Có lỗi xảy ra khi tìm kiếm truyện",
      error: error.message,
    });
  }
};



