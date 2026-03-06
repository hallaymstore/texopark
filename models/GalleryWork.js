const mongoose = require("mongoose");

const galleryWorkSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 3000,
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator(value) {
          return value.length > 0 && value.length <= 8;
        },
        message: "Gallery uchun 1 tadan 8 tagacha rasm bo'lishi kerak",
      },
    },
    category: {
      type: String,
      trim: true,
      default: "Real loyiha",
      maxlength: 100,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GalleryWork", galleryWorkSchema);
