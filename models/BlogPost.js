const mongoose = require("mongoose");

const blogPostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 220,
    },
    excerpt: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 700,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 20,
      maxlength: 15000,
    },
    coverImage: {
      type: String,
      default: "",
    },
    author: {
      type: String,
      default: "TEXNOPARK Matbuot xizmati",
      trim: true,
      maxlength: 120,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BlogPost", blogPostSchema);
