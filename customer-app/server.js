// deploy: cors update
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

import { generateText, generateImage } from "./ai-engine.js";

dotenv.config();

const app = express();
app.use(express.json());

// ------------------------------
// CORS (fix Vercel ↔ Railway)
// ------------------------------
const allowedOrigin = process.env.CORS_ORIGIN; // e.g. https://ai-earning-platform-psi.vercel.app

app.use(
  cors({
    origin: (origin, cb) => {
      // allow server-to-server / curl / postman
      if (!origin) return cb(null, true);
      if (!allowedOrigin) return cb(null, true);

      // normalize trailing slash issue
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
  }
}

connectDb();

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

    plan: { type: String, required: true }, // Starter/Pro/Agency
    amount: { type: Number, required: true },
    currency: { type: String, default: "USD" },

    method: { type: String, default: "paypal" }, // paypal | bank
    paypalEmail: { type: String, default: "" },
    transactionId: { type: String, default: "" },
    note: { type: String, default: "" },

    status: { type: String, default: "pending" }, // pending/approved/rejected
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
app.get("/", (req, res) => res.send("Customer API is running"));

// Register
app.post("/auth/register", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res
        .status(400)
        .json({ status: "error", message: "email and password required" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res
        .status(409)
        .json({ status: "error", message: "Email already registered" });
    }

    const user = await User.create({ email, password, credits: 20 });
    return res.json({
      status: "ok",
      userId: user._id,
      email: user.email,
      credits: user.credits,
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ status: "error", message: "Server error" });
  }
});

// Login
app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res
        .status(400)
        .json({ status: "error", message: "email and password required" });
    }

    const user = await User.findOne({ email });

    if (!user || user.password !== password) {
      return res
        .status(401)
        .json({ status: "error", message: "Invalid credentials" });
    }

    return res.json({
      status: "ok",
      userId: user._id,
      email: user.email,
      credits: user.credits,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ status: "error", message: "Server error" });
  }
});

// Get user
app.get("/auth/user/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "email credits role createdAt"
    );
    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    }
    return res.json({ status: "ok", user });
  } catch (err) {
    console.error("Get user error:", err);
    return res.status(500).json({ status: "error", message: "Server error" });
  }
});

// Create order (demo endpoint)
app.post("/order", async (req, res) => {
  try {
    const { service, prompt, userId } = req.body || {};
    if (!service || !prompt || !userId) {
      return res.status(400).json({
        status: "failed",
        message: "service, prompt, userId required",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ status: "failed", message: "User not found" });
    }
    if (user.credits <= 0) {
      return res.status(403).json({ status: "failed", message: "No credits" });
    }

    // Fake result (replace with your AI logic)
    const result =
      service === "image"
        ? "https://via.placeholder.com/512?text=AI+Image"
        : `AI Response: ${prompt}`;

    user.credits = Number(user.credits) - 1;
    await user.save();

    const order = await Order.create({
      userId,
      service,
      prompt,
      result,
      date: new Date(),
    });

    return res.json({
      status: "completed",
      result,
      orderId: order._id,
    });
  } catch (err) {
    console.error("Order error:", err);
    return res.status(500).json({ status: "failed", message: "Server error" });
  }
});

// User order history
app.get("/orders/user/:id", async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.id })
      .sort({ date: -1 })
      .limit(50);
    return res.json({ status: "ok", orders });
  } catch (err) {
    console.error("Orders error:", err);
    return res.status(500).json({ status: "error", message: "Server error" });
  }
});


// Payment request (customer submits)
app.post("/payments/request", async (req, res) => {
  try {
    const {
      userId,
      email,
      plan,
      amount,
      currency,
      method,
      paypalEmail,
      transactionId,
      note,
    } = req.body || {};

    if (!userId || !email || !plan || amount === undefined) {
      return res.status(400).json({
        status: "error",
        message: "userId, email, plan, amount required",
      });
    }

    const allowedPlans = ["Starter", "Pro", "Agency"];
    if (!allowedPlans.includes(String(plan))) {
      return res.status(400).json({ status: "error", message: "Invalid plan" });
    }

    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      return res.status(400).json({ status: "error", message: "Invalid amount" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    const pr = await PaymentRequest.create({
      userId,
      email,
      plan,
      amount: amt,
      currency: currency || "USD",
      method: method || "paypal",
      paypalEmail: paypalEmail || "",
      transactionId: transactionId || "",
      note: note || "",
      status: "pending",
    });

    return res.json({
      status: "ok",
      message: "Payment request submitted",
      requestId: pr._id,
    });
  } catch (err) {
    console.error("Payment request error:", err);
    return res.status(500).json({ status: "error", message: "Server error" });
  }
});

// ------------------------------
// Start
// ------------------------------
(async () => {
  await connectDb();
  const PORT = process.env.PORT || 3002;
  app.listen(PORT, () => console.log("🟢 Customer API on port", PORT));
})();
