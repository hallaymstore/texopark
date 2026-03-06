const mongoose = require("mongoose");

const preorderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    projectName: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    payerFullName: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
    payerPhone: { type: String, required: true, trim: true, minlength: 7, maxlength: 20 },
    transactionId: { type: String, required: true, trim: true, minlength: 3, maxlength: 160 },
    note: { type: String, trim: true, default: "", maxlength: 2000 },
    paymentScreenshot: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    adminNote: { type: String, trim: true, default: "", maxlength: 2000 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Preorder", preorderSchema);
