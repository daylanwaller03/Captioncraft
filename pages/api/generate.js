import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { imageUrl = "", tone = "funny" } = req.body || {};
  if (!process.env.OPENAI_API_KEY) return res.status(400).json({ error: "Missing OPENAI_API_KEY" });
  if (!imageUrl.trim()) return res.status(400).json({ error: "Missing imageUrl" });

  try {
    const messages = [
      {
        role: "user",
        content: [
          { type: "text", text: `Write 3 short social captions in a ${tone} tone for this image. Include 3 to 5 relevant hashtags. Return one caption per line.` },
          { type: "image_url", image_url: { url: imageUrl } }
        ]
      }
    ];

    const r = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.8
    });

    const text = r.choices?.[0]?.message?.content || "";
    res.status(200).json({ captions: text });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}