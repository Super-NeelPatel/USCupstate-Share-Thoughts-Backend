const mongoose = require("mongoose");

const replySchema = new mongoose.Schema({
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  }, // Reference to Student
  post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true }, // Reference to Post
});

const Reply = mongoose.model("Reply", replySchema);

module.exports = Reply;
