// admin/server.js
// --------------------
// Admin backend with payment approval
// --------------------
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
// In Railway admin service variables you already set:
// CORS_ORIGINS = https://ai-earning-platform-psi.vercel.app
const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const clean = (s) => String(s || "").replace(/\/$/, "");

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // server-to-server, Postman etc.
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-ADMIN-KEY"],
  })
);

// Preflight
app.options("*", cors());

// ------------------------------
// Mongo connection
// ------------------------------
const MONGO_URI = process.env.MONGO_URI;

async function connectMongo() {
  if (!MONGO_URI) {
    console.error("❌ MONGO_URI is not set");
    return;
  }
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ [ADMIN] Connected to MongoDB");
  } catch (err) {
    console.error("❌ [ADMIN] MongoDB connection failed:", err.message);
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
      .json({ status: "error", message: "Server misconfigured (no admin key)" });
  }

  if (!key || key !== expected) {
    return res
      .status(401)
      .json({ status: "error", message: "Unauthorized (missing/invalid admin key)" });
  }

  next();
}

// ------------------------------
// Schemas & models
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

    status: { type: String, default: "pending" }, // pending | approved | rejected
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
app.get("/", (req, res) => {
  res.send("Admin API is running");
});

// ------------------------------
// Protected admin routes
// ------------------------------
app.use("/admin", requireAdminKey);

// ---- Admin login (optional – already had this) ----
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

// ---- Users list ----
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

// ---- Set user credits ----
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

// ---- Orders list ----
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

// ------------------------------
// NEW: Payment Requests Admin API
// ------------------------------

// List payment requests (optionally by status)
app.get("/admin/payment-requests", async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;

    const requests = await PaymentRequest.find(query)
      .sort({ createdAt: -1 })
      .limit(100);

    return res.json({ status: "ok", requests });
  } catch (err) {
    console.error("Error in GET /admin/payment-requests:", err);
    return res
      .status(500)
      .json({ status: "error", message: "Internal server error" });
  }
});

// Approve a payment request: add credits to the user
app.post("/admin/payment-requests/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;
    const { creditsToAdd, adminNote } = req.body || {};

    const pr = await PaymentRequest.findById(id);
    if (!pr) {
      return res
        .status(404)
        .json({ status: "error", message: "Payment request not found" });
    }

    if (pr.status !== "pending") {
      return res.status(400).json({
        status: "error",
        message: `Request is already ${pr.status}`,
      });
    }

    const credits = Number(creditsToAdd);
    if (!Number.isFinite(credits) || credits <= 0) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid creditsToAdd" });
    }

    const user = await User.findById(pr.userId);
    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    }

    user.credits = Number(user.credits || 0) + credits;
    await user.save();

    pr.status = "approved";
    pr.creditsToAdd = credits;
    pr.adminNote = adminNote || "";
    pr.processedAt = new Date();
    await pr.save();

    return res.json({
      status: "ok",
      message: "Payment request approved and credits added",
      user: { id: user._id, email: user.email, credits: user.credits },
      paymentRequest: pr,
    });
  } catch (err) {
    console.error("Error in POST /admin/payment-requests/:id/approve:", err);
    return res
      .status(500)
      .json({ status: "error", message: "Internal server error" });
  }
});

// Reject a payment request
app.post("/admin/payment-requests/:id/reject", async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNote } = req.body || {};

    const pr = await PaymentRequest.findById(id);
    if (!pr) {
      return res
        .status(404)
        .json({ status: "error", message: "Payment request not found" });
    }

    if (pr.status !== "pending") {
      return res.status(400).json({
        status: "error",
        message: `Request is already ${pr.status}`,
      });
    }

    pr.status = "rejected";
    pr.adminNote = adminNote || "";
    pr.processedAt = new Date();
    await pr.save();

    return res.json({
      status: "ok",
      message: "Payment request rejected",
      paymentRequest: pr,
    });
  } catch (err) {
    console.error("Error in POST /admin/payment-requests/:id/reject:", err);
    return res
      .status(500)
      .json({ status: "error", message: "Internal server error" });
  }
});

// ------------------------------
// Start server
// ------------------------------
const PORT = process.env.PORT || 3003;

(async () => {
  await connectMongo();
  app.listen(PORT, () => {
    console.log(`🛠 Admin backend running on port ${PORT}`);
  });
})();