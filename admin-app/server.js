import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const app = express();
const allowedOrigin = process.env.CORS_ORIGIN || "*";

app.use(
  cors({
    origin: allowedOrigin === "*" ? true : allowedOrigin,
    credentials: false,
  })
);

app.use(express.json());

// ------------------------------
// MongoDB connection string
// Supports MONGO_URI or MONGO_URL
// ------------------------------
const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_URL;
if (!MONGO_URI) {
  console.error("❌ MONGO_URI / MONGO_URL is not set");
}

// ------------------------------
// MongoDB connection + start server
// ------------------------------
async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    // We DON'T exit, so the admin API can still run
  }

  const PORT = process.env.PORT || 3003;
  app.listen(PORT, () => {
    console.log(`🛠 Admin backend running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("Fatal error in start():", err);
});

// ------------------------------
// Schemas & models
// (must match customer-app)
// ------------------------------
const UserSchema = new mongoose.Schema(
  {
    email: String,
    password: String,
    role: { type: String, default: "customer" },
    credits: { type: Number, default: 20 },
  },
  { timestamps: true }
);

const OrderSchema = new mongoose.Schema(
  {
    userId: String,
    service: String,
    prompt: String,
    result: String,
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);
const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);

// ------------------------------
// Routes
// ------------------------------

app.get("/", (req, res) => {
  res.send("Admin API is running");
});

// Simple admin login (compares with env)
app.post("/admin/login", (req, res) => {
  const { email, password } = req.body;

  if (
    email === process.env.ADMIN_EMAIL &&
    password === process.env.ADMIN_PASSWORD
  ) {
    return res.json({ status: "ok" });
  }

  return res
    .status(401)
    .json({ status: "error", message: "Invalid admin credentials" });
});

// List all users
app.get("/admin/users", async (req, res) => {
  try {
    const users = await User.find({})
      .sort({ createdAt: -1 })
      .select("email role credits createdAt");
    return res.json({ status: "ok", users });
  } catch (err) {
    console.error("Error in GET /admin/users:", err);
    return res
      .status(500)
      .json({ status: "error", message: "Internal server error" });
  }
});

// Set a user's credits
app.post("/admin/users/set-credits", async (req, res) => {
  try {
    const { userId, credits } = req.body;

    if (!userId || credits === undefined) {
      return res
        .status(400)
        .json({ status: "error", message: "userId and credits are required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    }

    user.credits = Number(credits);
    await user.save();

    return res.json({
      status: "ok",
      userId: user._id,
      email: user.email,
      credits: user.credits,
    });
  } catch (err) {
    console.error("Error in POST /admin/users/set-credits:", err);
    return res
      .status(500)
      .json({ status: "error", message: "Internal server error" });
  }
});

// List recent orders
app.get("/admin/orders", async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ date: -1 }).limit(50);
    return res.json({ status: "ok", orders });
  } catch (err) {
    console.error("Error in GET /admin/orders:", err);
    return res
      .status(500)
      .json({ status: "error", message: "Internal server error" });
  }
});
