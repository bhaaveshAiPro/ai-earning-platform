// deploy: cors update
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const app = express();
app.use(express.json());

// ------------------------------
// CORS
// ------------------------------
const allowedOrigin = process.env.CORS_ORIGIN; // https://ai-earning-platform-psi.vercel.app

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (!allowedOrigin) return cb(null, true);

      const clean = (s) => String(s).replace(/\/$/, "");
      if (clean(origin) === clean(allowedOrigin)) return cb(null, true);

      return cb(new Error("CORS blocked: " + origin));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("*", cors());

// ------------------------------
// Mongo
// ------------------------------
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) console.error("❌ MONGO_URI is not set");

async function connectDb() {
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
// Models
// ------------------------------
const UserSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true },
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

const PaymentRequestSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    email: { type: String, required: true },

    plan: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "USD" },

    method: { type: String, default: "paypal" },
    paypalEmail: { type: String, default: "" },
    transactionId: { type: String, default: "" },
    note: { type: String, default: "" },

    status: { type: String, default: "pending" },
    adminNote: { type: String, default: "" },
    creditsToAdd: { type: Number, default: 0 },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);
const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);
const PaymentRequest =
  mongoose.models.PaymentRequest ||
  mongoose.model("PaymentRequest", PaymentRequestSchema);

// ------------------------------
// Routes
// ------------------------------
app.get("/", (req, res) => res.send("Admin API is running"));

// Admin login
app.post("/admin/login", (req, res) => {
  const { email, password } = req.body || {};
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

// Users
app.get("/admin/users", async (req, res) => {
  try {
    const users = await User.find({})
      .sort({ createdAt: -1 })
      .select("email role credits createdAt");
    return res.json({ status: "ok", users });
  } catch (err) {
    console.error("GET /admin/users:", err);
    return res.status(500).json({ status: "error", message: "Server error" });
  }
});

// Set credits
app.post("/admin/users/set-credits", async (req, res) => {
  try {
    const { userId, credits } = req.body || {};
    if (!userId || credits === undefined) {
      return res
        .status(400)
        .json({ status: "error", message: "userId and credits required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    user.credits = Number(credits);
    await user.save();

    return res.json({ status: "ok", userId: user._id, credits: user.credits });
  } catch (err) {
    console.error("POST /admin/users/set-credits:", err);
    return res.status(500).json({ status: "error", message: "Server error" });
  }
});

// Orders
app.get("/admin/orders", async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ date: -1 }).limit(50);
    return res.json({ status: "ok", orders });
  } catch (err) {
    console.error("GET /admin/orders:", err);
    return res.status(500).json({ status: "error", message: "Server error" });
  }
});

// Payment requests list
app.get("/admin/payment-requests", async (req, res) => {
  try {
    const status = String(req.query.status || "pending");
    const q = status ? { status } : {};
    const requests = await PaymentRequest.find(q).sort({ createdAt: -1 });
    return res.json({ status: "ok", requests });
  } catch (err) {
    console.error("GET /admin/payment-requests:", err);
    return res.status(500).json({ status: "error", message: "Server error" });
  }
});

// Approve request and add credits
app.post("/admin/payment-requests/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;
    const { creditsToAdd, adminNote } = req.body || {};

    const add = Number(creditsToAdd);
    if (!Number.isFinite(add) || add <= 0) {
      return res
        .status(400)
        .json({ status: "error", message: "creditsToAdd must be > 0" });
    }

    const pr = await PaymentRequest.findById(id);
    if (!pr) return res.status(404).json({ status: "error", message: "Not found" });
    if (pr.status !== "pending")
      return res.status(400).json({ status: "error", message: "Already processed" });

    const user = await User.findById(pr.userId);
    if (!user) return res.status(404).json({ status: "error", message: "User not found" });

    user.credits = Number(user.credits || 0) + add;
    await user.save();

    pr.status = "approved";
    pr.creditsToAdd = add;
    pr.adminNote = adminNote || "";
    pr.processedAt = new Date();
    await pr.save();

    return res.json({
      status: "ok",
      message: "Approved and credits added",
      userId: user._id,
      newCredits: user.credits,
    });
  } catch (err) {
    console.error("POST approve:", err);
    return res.status(500).json({ status: "error", message: "Server error" });
  }
});

// Reject request
app.post("/admin/payment-requests/:id/reject", async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNote } = req.body || {};

    const pr = await PaymentRequest.findById(id);
    if (!pr) return res.status(404).json({ status: "error", message: "Not found" });
    if (pr.status !== "pending")
      return res.status(400).json({ status: "error", message: "Already processed" });

    pr.status = "rejected";
    pr.adminNote = adminNote || "";
    pr.processedAt = new Date();
    await pr.save();

    return res.json({ status: "ok", message: "Rejected" });
  } catch (err) {
    console.error("POST reject:", err);
    return res.status(500).json({ status: "error", message: "Server error" });
  }
});

// ------------------------------
// Start (ONE listen only)
// ------------------------------
(async () => {
  await connectDb();
  const PORT = process.env.PORT || 3003;
  app.listen(PORT, () => console.log("🟣 Admin API on port", PORT));
})();
