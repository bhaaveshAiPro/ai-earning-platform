import mongoose from "../db.js";

const UserSchema = new mongoose.Schema({
  userId: { type: String, unique: true },
  email: String,
  password: String,
  role: {
    type: String,
    enum: ["ADMIN", "CUSTOMER", "SELLER"],
    default: "CUSTOMER"
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("User", UserSchema);
