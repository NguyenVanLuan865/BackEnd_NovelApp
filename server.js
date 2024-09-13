const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const dotenv = require("dotenv");
const authorRoute = require("./routes/author");
const bookRoute = require("./routes/book");
const userRoute = require("./routes/user");
const textFileRoute = require("./routes/file");
const novelRoute = require("./routes/novel");
const commentRoute = require("./routes/comment");
const chapterRoute = require("./routes/chapter");
const { User } = require("./model/model");

dotenv.config();


const port = process.env.PORT || 8000;

const app = express();

// Middlewares
app.use(bodyParser.json({ limit: "50mb" }));
app.use(cors());
app.use(morgan("common"));

app.get('/', (req, res) => {
  res.send('Luađásn');
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect("mongodb+srv://Vanluan02022002:Vanluan02022002@cluster0.vlxmssh.mongodb.net/", {
    });
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Error connecting to MongoDB", err);
    process.exit(1); 
  }
};
const updateUserFields = async () => {
  try {
    const users = await User.find({ resetToken: { $exists: false } });
    for (const user of users) {
      user.resetToken = undefined;
      user.resetTokenExpiry = undefined;
      await user.save();
    }
    console.log('User documents updated');
  } catch (err) {
    console.error('Error updating user documents:', err);
  } finally {
    mongoose.connection.close();
  }
};
connectDB();

app.use("/v1/author", authorRoute);
app.use("/v1/book", bookRoute);
app.use("/v1/user", userRoute); 
app.use("/v1/file", textFileRoute);
app.use("/v1/novel", novelRoute);
app.use("/v1/chapter", chapterRoute);
app.use("/v1/comment", commentRoute);


// Start server
app.listen(8000, '192.168.1.13', () => {
  console.log('Server is running on http://192.168.1.13:8000');
});
