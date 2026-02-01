import mongoose from "../db.js";

const AiUsageSchema = new mongoose.Schema({
  userId: String,
  service: String,
  cost: Number,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("AiUsage", AiUsageSchema);
