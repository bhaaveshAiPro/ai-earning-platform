import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

export async function generateText(prompt) {
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }]
  });
  return res.choices[0].message.content;
}

export async function generateImage(prompt) {
  const res = await openai.images.generate({
    model: "gpt-image-1",
    prompt
  });
  return res.data[0].url;
}
