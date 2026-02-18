// deploy: cors update
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

import { generateText, generateImage } from "./ai-engine.js";

dotenv.config();

const app = express();
const allowedOrigins = [
  "https://ai-earning-platform-psi.vercel.app"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        return callback(new Error("Not allowed by CORS"), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);


app.use(express.json());

// -----------------------------------
// MongoDB connection (local)
// -----------------------------------
let dbConnected = false;

async function connectDB() {
  try {
    console.log("🌐 Using MongoDB:", process.env.MONGO_URI);
    
    await mongoose.connect(process.env.MONGO_URI);
    
    dbConnected = true;
    console.log("🔥 Customer backend connected to MongoDB (cloud)");
  } catch (err) {
    dbConnected = false;
    console.log("⚠️ Customer MongoDB connection failed, continuing without DB:",err.code || err.message);
    }
}

connectDB();

// -----------------------------------
// Schemas & Models
// -----------------------------------
const UserSchema = new mongoose.Schema({
  email: String,
  password: String, // dev only (plain); later use hashing
  role: { type: String, default: "customer" },
  credits: { type: Number, default: 20 },
},
{ timestamps: true }
);

const OrderSchema = new mongoose.Schema({
  userId: String,
  service: String, // "content" | "image"
  prompt: String,
  result: String,
  date: { type: Date, default: Date.now },
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);
const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);

// -----------------------------------
// Auth routes (DEV simple version)
// -----------------------------------

// Register new user
app.post("/auth/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ status: "error", message: "email and password are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res
        .status(400)
        .json({ status: "error", message: "User already exists" });
    }

    const user = await User.create({
      email,
      password, // plain for now (dev)
      role: "customer",
      credits: 20,
    });

    return res.json({
      status: "ok",
      userId: user._id,
      email: user.email,
      credits: user.credits,
    });
  } catch (err) {
    console.error("Error in /auth/register:", err);
    return res
      .status(500)
      .json({ status: "error", message: "Internal server error" });
  }
});

// Login existing user
app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ status: "error", message: "email and password are required" });
    }

    const user = await User.findOne({ email });

    if (!user || user.password !== password) {
      return res
        .status(401)
        .json({ status: "error", message: "Invalid email or password" });
    }

    return res.json({
      status: "ok",
      userId: user._id,
      email: user.email,
      credits: user.credits,
    });
  } catch (err) {
    console.error("Error in /auth/login:", err);
    return res
      .status(500)
      .json({ status: "error", message: "Internal server error" });
  }
});
// ----------------------------------------
// Fake purchase endpoint (dev / demo only)
// ----------------------------------------

const PLAN_CREDITS = {
  starter: 500,
  pro: 3000,
  agency: 15000,
};

app.post("/purchase/fake", async (req, res) => {
  try {
    const { userId, plan } = req.body;

    if (!userId || !plan) {
      return res
        .status(400)
        .json({ status: "error", message: "userId and plan are required" });
    }

    const key = String(plan).toLowerCase(); // "Starter" -> "starter"
    const addCredits = PLAN_CREDITS[key];

    if (!addCredits) {
      return res
        .status(400)
        .json({ status: "error", message: "Unknown plan" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    }

    user.credits = (user.credits || 0) + addCredits;
    await user.save();

    console.log(
      `💳 Fake purchase: added ${addCredits} credits (${plan}) for ${user.email}`
    );

    return res.json({
      status: "ok",
      message: `Added ${addCredits} credits for plan ${plan}`,
      credits: user.credits,
      userId: user._id,
    });
  } catch (err) {
    console.error("Error in POST /purchase/fake:", err);
    return res
      .status(500)
      .json({ status: "error", message: "Internal server error" });
  }
});

// Get user info by id (for refreshing credits on frontend)
app.get("/auth/user/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    }

    return res.json({
      status: "ok",
      user: {
        id: user._id,
        email: user.email,
        credits: user.credits,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Error in GET /auth/user/:id:", err);
    return res
      .status(500)
      .json({ status: "error", message: "Internal server error" });
  }
});
// Get orders for a specific user (for profile & history)
app.get("/orders/user/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const orders = await Order.find({ userId: id })
      .sort({ date: -1 })
      .limit(20); // latest 20

    return res.json({
      status: "ok",
      orders,
    });
  } catch (err) {
    console.error("Error in GET /orders/user/:id:", err);
    return res
      .status(500)
      .json({ status: "error", message: "Internal server error" });
  }
});


// -----------------------------------
// Health route
// -----------------------------------
app.get("/", (req, res) => {
  res.send("Customer API is running");
});

// -----------------------------------
// Main order route WITH credits logic
// -----------------------------------
app.post("/order", async (req, res) => {
  const { service, prompt, userId } = req.body;

  if (!service || !prompt) {
    return res.status(400).json({
      status: "error",
      message: "service and prompt are required",
    });
  }

  let userDoc = null;

  // 1) If DB is connected and we have a userId, try to enforce credits
  if (dbConnected && userId) {
    try {
      userDoc = await User.findById(userId);

      if (!userDoc) {
        return res.status(404).json({
          status: "error",
          message: "User not found for credits check",
        });
      }

      if ((userDoc.credits ?? 0) <= 0) {
        return res.status(403).json({
          status: "error",
          message: "No credits left for this user",
        });
      }
    } catch (err) {
      console.log(
        "⚠️ DB error while checking credits:",
        err.code || err.message || err
      );
      // If DB has an issue, continue without blocking usage
      userDoc = null;
    }
  }

  try {
    let result;

    if (service === "content") {
      result = await generateText(prompt);
    } else if (service === "image") {
      result = await generateImage(prompt);
    } else {
      return res.status(400).json({
        status: "error",
        message: "Unknown service type",
      });
    }

    // 2) If we have a user & DB, decrement credits and log order
    if (dbConnected && userDoc) {
      try {
        userDoc.credits = (userDoc.credits || 0) - 1;
        if (userDoc.credits < 0) userDoc.credits = 0;
        await userDoc.save();

        await Order.create({
          userId: userDoc._id.toString(),
          service,
          prompt,
          result: typeof result === "string" ? result.slice(0, 2000) : "",
        });
      } catch (err) {
        console.log(
          "⚠️ DB error while saving credits/order:",
          err.code || err.message || err
        );
        // do not block success if logging fails
      }
    }

    return res.json({
      status: "completed",
      result,
    });
  } catch (err) {
    console.error("❌ Error in /order:", err);
    return res.status(500).json({
      status: "error",
      message: err.message || "Internal server error",
    });
  }
});

// -----------------------------------
// Start server
// -----------------------------------
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`🚀 Customer API running on port ${PORT}`);
});
