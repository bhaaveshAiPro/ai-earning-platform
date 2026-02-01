import express from "express";
import dotenv from "dotenv";
import { generateText, generateImage } from "../shared/ai-engine.js";

dotenv.config();
const app = express();
app.use(express.json());

app.post("/order", async (req, res) => {
  const { service, prompt } = req.body;

  let result;
  if (service === "content") {
    result = await generateText(prompt);
  }
  if (service === "image") {
    result = await generateImage(prompt);
  }

  res.json({
    status: "completed",
    result
  });
});

app.get("/reviews", (req, res) => {
  res.json([
    { user: "Alex", rating: 5, comment: "Amazing AI content!" },
    { user: "Maya", rating: 5, comment: "Worth every dollar" }
  ]);
});

app.listen(5000, () => console.log("Customer app running on 5000"));
