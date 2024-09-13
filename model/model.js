const mongoose = require("mongoose");

const authorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  novel: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Novel",
    },
  ],
});

const chapterSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  number: {
    type: Number,
    required: true
  },
  content: {
    type: String,
    required: true
  }, // Nội dung dưới dạng text
  novelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Novel', required: true
  }
}, { timestamps: true });

const novelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  publishedDate: {
    type: Date, 
  },
  genres: {
    type: [String],
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Author",
  },
  chapters: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chapter",
    },
  ],
  rating: {
    type: Number,
    default: 0,
  },
  progress: {
    type: Boolean, 
    default: false, 
  },
  imageNovel: {
    type: String,
  },
  description: {
    type: String,
  },
});

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true, 
    trim: true   
  },
  email: {
    type: String,
    required: true,
    unique: true, 
    trim: true,   
    lowercase: true 
  },
  password: {
    type: String,
    required: true,
  },
  profilePicture: {
    type: String,
    default: 'image/avatar.jpg' 
  },
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Novel'
  }],
  readingHistory: [{
    novel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Novel'
    },
    chapter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chapter'
    },
    position: {
      type: Number,
      min: 0, 
      default: 0
    },
    lastRead: {
      type: Date,
      default: Date.now 
    }
  }],
  preferences: {
    type: mongoose.Schema.Types.Mixed, 
    default: {}
  },
  resetToken: {  
    type: String,
  },
  resetTokenExpiry: {  
    type: Date,
  }

}, {
  timestamps: true 
});


const textFileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
    unique: true,
  },
  content: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  novelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Novel',
    required: true
  },
  chapterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter',
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  }
}, { timestamps: true });

// Huyền Huyễn
const huyenHuyenNovelSchema = new mongoose.Schema({
  novelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Novel",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
});

// Tiên Hiệp 
const tienHiepNovelSchema = new mongoose.Schema({
  novelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Novel",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
});

// Hiệp Khách
const hiepKhachNovelSchema = new mongoose.Schema({
  novelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Novel",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
});

// Đồng Nhân
const dongNhanNovelSchema = new mongoose.Schema({
  novelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Novel",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
});

// Hệ Thống
const heThongNovelSchema = new mongoose.Schema({
  novelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Novel",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
});

// Ngôn Tình
const ngonTinhNovelSchema = new mongoose.Schema({
  novelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Novel",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
});

// Khoa Huyễn
const khoaHuyenNovelSchema = new mongoose.Schema({
  novelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Novel",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
});

// Hài Hước 
const haiHuocNovelSchema = new mongoose.Schema({
  novelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Novel",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
});

// Dị năng 
const diNangNovelSchema = new mongoose.Schema({
  novelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Novel",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
});

// Trọng Sinh
const trongSinhNovelSchema = new mongoose.Schema({
  novelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Novel",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
});

// Võng Du
const vongDuNovelSchema = new mongoose.Schema({
  novelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Novel",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
});

const File = mongoose.model("File", textFileSchema);
const Novel = mongoose.model("Novel", novelSchema);
const Author = mongoose.model("Author", authorSchema);
const Chapter = mongoose.model("Chapter", chapterSchema);
const User = mongoose.model("User", userSchema);
const Comment = mongoose.model('Comment', commentSchema);
const HuyenHuyenNovel = mongoose.model("HuyenHuyenNovel", huyenHuyenNovelSchema);
const TienHiepNovel = mongoose.model("TienHiepNovel", tienHiepNovelSchema);
const HiepKhachNovel = mongoose.model("HiepKhachNovel", hiepKhachNovelSchema);
const DongNhanNovel = mongoose.model("DongNhanNovel", dongNhanNovelSchema);
const HeThongNovel = mongoose.model("HeThongNovel", heThongNovelSchema);
const NgonTinhNovel = mongoose.model("NgonTinhNovel", ngonTinhNovelSchema);
const KhoaHuyenNovel = mongoose.model("KhoaHuyenNovel", khoaHuyenNovelSchema);
const HaiHuocNovel = mongoose.model("HaiHuocNovel", haiHuocNovelSchema);
const DiNangNovel = mongoose.model("DiNangNovel", diNangNovelSchema);
const TrongSinhNovel = mongoose.model("TrongSinhNovel", trongSinhNovelSchema);
const VongDuNovel = mongoose.model("VongDuNovel", vongDuNovelSchema);

module.exports = {
  Novel,
  Author,
  Chapter,
  User,
  File,
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
};
