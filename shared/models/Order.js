import mongoose from "../db.js";

const OrderSchema = new mongoose.Schema({
  userId: String,
  serviceType: {
    type: String,
    enum: ["CONTENT", "IMAGE", "CHATBOT", "MARKETPLACE"]
  },
  prompt: String,
  result: String,
  status: {
    type: String,
    enum: ["PENDING", "COMPLETED"],
    default: "PENDING"
  },
  price: Number,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Order", OrderSchema);
