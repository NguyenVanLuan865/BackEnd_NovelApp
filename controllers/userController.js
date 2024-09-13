const { User } = require("../model/model");
const bcrypt = require("bcrypt");
const mongoose = require('mongoose');
const axios = require('axios');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { getMaxListeners } = require("events");

const HUNTER_API_KEY = 'e54460f443c08f5b6d1646bd6a63468663ecfa2b';

const transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: {
    user: 'nguyenvanluan865@gmailcom', 
    pass: 'Vanluan865'
  }
});

const sendPasswordResetEmail = async (email, resetToken) => {
  const mailOptions = {
    from: process.env.EMAIL_USER, 
    to: email,
    subject: 'Password Reset Request',
    text: `You requested a password reset. Please use the following token to reset your password: ${resetToken}`,
    html: `<p>You requested a password reset. Please use the following token to reset your password: <strong>${resetToken}</strong></p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};
const userController = {
  RegisterUser: async (req, res) => {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ error: "All fields are required" });
      }

      const emailValidationResponse = await axios.get(`https://api.hunter.io/v2/email-verifier`, {
        params: {
          email,
          api_key: HUNTER_API_KEY
        }
      });

      const { data } = emailValidationResponse;
      const { status, score } = data.data; 

      if (status !== 'valid' || score < 80) {
        return res.status(400).json({ error: "Invalid email address" });
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10); 

      const newUser = new User({
        username,
        email,
        password: hashedPassword,
      });

      const savedUser = await newUser.save();
      res.status(201).json({
        id: savedUser._id,
        username: savedUser.username,
        email: savedUser.email,
      }); 
    } catch (err) {
      console.error("Error registering user:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // LOGIN
  LoginUser: async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email }).populate(
        "readingHistory.novel readingHistory.chapter"
      );
      if (!user) {
        return res.status(400).json({ error: "User does not exist" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(400).json({ error: "Wrong credentials!" });
      }

      const readingProgress = user.readingHistory.map((entry) => ({
        novelId: entry.novel._id,
        novelName: entry.novel.name,
        chapterId: entry.chapter._id,
        chapterTitle: entry.chapter.title,
        position: entry.position,
        lastRead: entry.lastRead,
      }));

      res.status(200).json({
        message: "Login successful",
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.profilePicture,
          readingProgress,
        },
      });
    } catch (err) {
      console.error("Error logging in user:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // FORGOT PASSWORD
  ForgotPassword: async (req, res) => {
    const { email } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      user.resetToken = resetToken;
      user.resetTokenExpiry = Date.now() + 3600000; 
  
      await user.save();
      await sendPasswordResetEmail(email, resetToken);
  
      res.status(200).json({ message: 'Password reset email sent' });
    } catch (error) {
      console.error('Error in forgotPassword:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },


  // RESET PASSWORD
  ResetPassword: async (req, res) => {
    try {
      const { resetToken, newPassword } = req.body;

      const user = await User.findOne({
        resetToken, 
        resetTokenExpiry: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({ error: "Invalid or expired token" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      user.password = hashedPassword;
      user.resetToken = undefined;
      user.resetTokenExpiry = undefined;
      await user.save();

      res.status(200).json({ message: "Password has been reset successfully" });

    } catch (err) {
      console.error("Error resetting password:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // UPDATE READING PROGRESS
  updateReadingProgress: async (req, res) => {
    const { userId, novelId, chapterId, position } = req.body;

    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (!Array.isArray(user.readingHistory)) {
        return res.status(500).json({ error: "Reading history is not an array" });
      }

      let existingProgress = user.readingHistory.find(
        (progress) => progress.novel.toString() === novelId
      );

      if (existingProgress) {
        existingProgress.chapter = chapterId;
        existingProgress.position = position;
        existingProgress.lastRead = new Date();
      } else {
        user.readingHistory.push({
          novel: novelId,
          chapter: chapterId,
          position,
          lastRead: new Date(),
        });
      }

      await user.save();
      res.status(200).json({ message: "Reading progress updated successfully" });
    } catch (error) {
      console.error("Error updating reading progress:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // GET USER READING HISTORY WITH NOVELS
  getUserReadingHistoryWithNovels: async (req, res) => {
    const { userId } = req.params;
    try {
      const userReadingHistory = await User.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(userId) } },
        { $unwind: "$readingHistory" },
        {
          $lookup: {
            from: "novels",
            localField: "readingHistory.novel",
            foreignField: "_id",
            as: "novelInfo"
          }
        },
        { $unwind: "$novelInfo" },
        {
          $lookup: {
            from: "chapters",
            localField: "readingHistory.chapter",
            foreignField: "_id",
            as: "chapterInfo"
          }
        },
        { $unwind: "$chapterInfo" },
        {
          $project: {
            _id: 0,
            novel: {
              _id: "$novelInfo._id",
              name: "$novelInfo.name",
              author: "$novelInfo.author",
              publishedDate: "$novelInfo.publishedDate",
              rating: "$novelInfo.rating",
              imageNovel: "$novelInfo.imageNovel",
            },
            chapter: {
              _id: "$chapterInfo._id",
              title: "$chapterInfo.title",
              content: "$chapterInfo.content",
            },
            position: "$readingHistory.position",
            lastRead: "$readingHistory.lastRead",
          }
        }
      ]);

      res.status(200).json(userReadingHistory);
    } catch (error) {
      console.error("Error getting user reading history with novels:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
};

module.exports = userController;
