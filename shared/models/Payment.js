import mongoose from "../db.js";

const PaymentSchema = new mongoose.Schema({
  userId: String,
  orderId: String,
  method: {
    type: String,
    enum: ["PAYPAL", "BANK"]
  },
  amount: Number,
  status: {
    type: String,
    enum: ["PENDING", "PAID"],
    default: "PENDING"
  },
  transactionId: String,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Payment", PaymentSchema);
