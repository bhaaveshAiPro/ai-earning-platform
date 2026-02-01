import mongoose from "../db.js";

const MarketplaceItemSchema = new mongoose.Schema({
  title: String,
  description: String,
  price: Number,
  creatorId: String,
  rating: { type: Number, default: 5 },
  sales: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("MarketplaceItem", MarketplaceItemSchema);
