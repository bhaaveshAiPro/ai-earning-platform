import mongoose from "../db.js";

const SubscriptionSchema = new mongoose.Schema({
  userId: String,
  plan: {
    type: String,
    enum: ["STARTER", "PRO", "ENTERPRISE"]
  },
  aiCredits: Number,
  expiresAt: Date,
  active: { type: Boolean, default: true }
});

export default mongoose.model("Subscription", SubscriptionSchema);
