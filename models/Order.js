const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    customerName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    items: {
      type: [orderItemSchema],
      validate: {
        validator(value) {
          return value.length > 0;
        },
        message: "Order kamida bitta mahsulotdan iborat bo'lishi kerak",
      },
    },
    total: { type: Number, required: true, min: 0 },
    note: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["new", "accepted", "rejected"],
      default: "new",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
