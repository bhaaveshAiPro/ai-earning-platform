import mongoose from "../db.js";

const ReviewSchema = new mongoose.Schema({
  userId: String,
  serviceId: String,
  rating: Number,
  comment: String,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Review", ReviewSchema);
