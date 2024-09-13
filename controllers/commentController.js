const { Comment, User, Novel , Chapter } = require("../model/model");

// Lấy tất cả comment của một truyện, bao gồm nội dung, id user, và số lượng reply
exports.getAllCommentsByNovelId = async (req, res) => {
  try {
    const { novelId } = req.params;
    const comments = await Comment.find({ novelId, parentComment: null })
      .populate('userId', 'username') 
      .populate('chapterId', 'title');
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({ parentComment: comment._id })
          .populate('userId', 'username')  
          .populate('chapterId', 'title');

        const replyCount = replies.length;

        return {
          id: comment._id,
          content: comment.content,
          userId: comment.userId,
          createdAt: comment.createdAt,
          replyCount: replyCount,
          replies: replies.map(reply => ({
            content: reply.content,
            userId: reply.userId,
            createdAt: reply.createdAt,
          }))
        };
      })
    );
    res.status(200).json({ comments: commentsWithReplies });
  } catch (error) {
    res.status(500).json({ message: "Có lỗi xảy ra khi lấy bình luận của truyện", error: error.message });
  }
};


// Lấy một comment cụ thể theo ID
exports.getCommentById = async (req, res) => {
  try {
    const { commentId } = req.params;
    const comment = await Comment.findById(commentId)
      .populate('userId', 'username')
      .populate('chapterId', 'title');

    if (!comment) {
      return res.status(404).json({ message: "Bình luận không tồn tại" });
    }

    const replies = await Comment.find({ parentComment: comment._id })
      .populate('userId', 'username')
      .populate('chapterId', 'title');

    res.status(200).json({ comment, replies });
  } catch (error) {
    res.status(500).json({ message: "Có lỗi xảy ra khi lấy bình luận", error: error.message });
  }
};

// Đăng một comment mới
exports.postComment = async (req, res) => {
    const { content, userId, novelId, chapterId } = req.body;
  
    try {
      if (!content || !userId || !novelId) {
        return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(400).json({ message: "Người dùng không tồn tại" });
      }

      const novel = await Novel.findById(novelId);
      if (!novel) {
        return res.status(400).json({ message: "Truyện không tồn tại" });
      }

      if (chapterId) {
        const chapter = await Chapter.findById(chapterId);
        if (!chapter) {
          return res.status(400).json({ message: "Chương truyện không tồn tại" });
        }
      }

      const newComment = new Comment({
        content,
        userId,
        novelId,
        chapterId,
      });
  
      await newComment.save();
      res.status(201).json({ message: "Đăng bình luận thành công", comment: newComment });
  
    } catch (error) {
      res.status(500).json({ message: "Lỗi server", error });
    }
  };
  

// Đăng một reply cho comment
exports.postReply = async (req, res) => {
    const { content, userId, parentComment } = req.body;
  
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(400).json({ message: "Người dùng không tồn tại" });
      }
      const parent = await Comment.findById(parentComment);
      if (!parent) {
        return res.status(400).json({ message: "Comment gốc không tồn tại" });
      }

      const newReply = new Comment({
        content,
        userId,
        novelId: parent.novelId,  
        chapterId: parent.chapterId,
        parentComment
      });
  
      const savedReply = await newReply.save();
  
      res.status(201).json({ message: "Đăng trả lời thành công", reply: savedReply });
    } catch (error) {
      res.status(500).json({ message: "Có lỗi xảy ra khi đăng trả lời", error: error.message });
    }
  };
