import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());

mongoose.connect(process.env.MONGO_URI);

const ADMIN_ID = "Bhaavesh11";
const ADMIN_PASS = "BLade@7051";
const JWT_SECRET = "superadminsecret";

app.post("/admin/login", (req, res) => {
  const { userId, password } = req.body;

  if (userId === ADMIN_ID && password === ADMIN_PASS) {
    const token = jwt.sign({ role: "admin" }, JWT_SECRET);
    return res.json({ token });
  }
  res.status(401).json({ error: "Invalid credentials" });
});

app.get("/admin/dashboard", (req, res) => {
  res.json({
    totalEarnings: "$12,480",
    ordersToday: 32,
    aiUsageCost: "$83.40",
    netProfit: "$12,396.60"
  });
});

app.listen(5001, () => console.log("Admin panel running on 5001"));
