import dotenv from "dotenv";
dotenv.config();


// ========== TEXT GENERATION (GROQ) ==========
import OpenAI from "openai";
const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export async function generateText(prompt) {
  const res = await client.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [{ role: "user", content: prompt }],
  });

  return res.choices[0].message.content;
}

// ========== IMAGE GENERATION (FLUX / BFL / HuggingFace) ==========
export async function generateImage(prompt) {
  const HF_TOKEN = process.env.HF_TOKEN;
  if (!HF_TOKEN) throw new Error("Missing HF_TOKEN in .env");

  try {
    const response = await fetch(
      "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error("HF error:", text);
      throw new Error("HuggingFace image generation failed");
    }

    // Router returns raw image bytes
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    return `data:image/png;base64,${base64}`;
  } catch (err) {
    console.error("❌ HF image generation error:", err);
    return `Image generation failed: ${err.message}`;
  }
}
