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
// Set in Railway (admin service):
// CORS_ORIGINS=https://ai-earning-platform-psi.vercel.app,http://localhost:3000
// ------------------------------
const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const clean = (s) => String(s || "").replace(/\/$/, "");

app.use(
  cors({
    origin: (origin, cb) => {
      // allow server-to-server / curl (no origin)
      if (!origin) return cb(null, true);
      const ok = allowedOrigins.some((o) => clean(o) === clean(origin));
      if (ok) return cb(null, true);
      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-ADMIN-KEY"],
  })
);

// Railway/Browser preflight
app.options("*", cors());

// ------------------------------
// Mongo connect
// ------------------------------
const MONGO_URI = process.env.MONGO_URI;

async function connectMongo() {
  if (!MONGO_URI) {
    console.error("❌ MONGO_URI is not set");
    return;
  }
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
  }
}

// ------------------------------
// Admin key middleware
// ------------------------------
function requireAdminKey(req, res, next) {
  const key = req.header("X-ADMIN-KEY");
  const expected = process.env.ADMIN_API_KEY;

  if (!expected) {
    console.error("❌ ADMIN_API_KEY is not set on server");
    return res
      .status(500)
      .json({ status: "error", message: "Server misconfigured" });
  }

  if (!key || key !== expected) {
    return res.status(401).json({
      status: "error",
      message: "Unauthorized (missing/invalid admin key)",
    });
  }

  next();
}

// ------------------------------
// Models (must match customer)
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
// Public route
// ------------------------------
app.get("/", (req, res) => res.send("Admin API is running"));

// ------------------------------
// Protect everything under /admin
// ------------------------------
app.use("/admin", requireAdminKey);

// Admin login (still requires admin key + creds)
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

// Orders
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

// Optional: list payment requests
app.get("/admin/payments/requests", async (req, res) => {
  try {
    const requests = await PaymentRequest.find({})
      .sort({ createdAt: -1 })
      .limit(100);
    return res.json({ status: "ok", requests });
  } catch (err) {
    console.error("Error in GET /admin/payments/requests:", err);
    return res
      .status(500)
      .json({ status: "error", message: "Internal server error" });
  }
});

// Optional: approve payment request + add credits
app.post("/admin/payments/approve", async (req, res) => {
  try {
    const { requestId, creditsToAdd, adminNote } = req.body || {};
    if (!requestId || creditsToAdd === undefined) {
      return res.status(400).json({
        status: "error",
        message: "requestId and creditsToAdd required",
      });
    }

    const pr = await PaymentRequest.findById(requestId);
    if (!pr) {
      return res
        .status(404)
        .json({ status: "error", message: "Payment request not found" });
    }

    const user = await User.findById(pr.userId);
    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    }

    const add = Number(creditsToAdd);
    user.credits = Number(user.credits || 0) + (Number.isFinite(add) ? add : 0);
    await user.save();

    pr.status = "approved";
    pr.creditsToAdd = add;
    pr.adminNote = adminNote || "";
    pr.processedAt = new Date();
    await pr.save();

    return res.json({
      status: "ok",
      message: "Approved & credits added",
      userId: user._id,
      newCredits: user.credits,
    });
  } catch (err) {
    console.error("Approve payment error:", err);
    return res.status(500).json({ status: "error", message: "Server error" });
  }
});

// ------------------------------
// Start server (ONLY ONCE)
// ------------------------------
const PORT = process.env.PORT || 3003;

(async () => {
  await connectMongo();
  const PORT = process.env.PORT || 3003;
  app.listen(PORT, () => console.log("🟣 Admin API on port", PORT));
})();
