const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },
    community: { type: mongoose.Schema.Types.ObjectId, ref: "Community" },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    votes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);
