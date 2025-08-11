import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// fallback captions when quota is hit
function demoCaptions(tone) {
  const vibe = tone || "funny";
  return [
    `Vacation vibes. ${vibe} caption time. #Travel #Wanderlust #GoodTimes #PhotoOfTheDay #Memories`,
    `Caught the moment just right. ${vibe} mood only. #Weekend #HappyPlace #InstaDaily #NoFilter`,
    `Living for scenes like this. ${vibe} energy. #Sunset #Chill #Blessed #BucketList #Life`,
  ];
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { imageUrl = "", description = "", tone = "funny" } = req.body || {};
  const hasImage = imageUrl.trim().length > 0;
  const hasText = description.trim().length > 0;
  if (!hasImage && !hasText) return res.status(400).json({ error: "Provide imageUrl or description" });

  try {
    const messages = hasImage
      ? [
          {
            role: "user",
            content: [
              { type: "text", text: `Write 3 short social captions in a ${tone} tone for this image. Include 3 to 5 relevant hashtags. One caption per line.` },
              { type: "image_url", image_url: { url: imageUrl } }
            ]
          }
        ]
      : [
          {
            role: "user",
            content: `Write 3 short social captions in a ${tone} tone for: "${description}". Include 3 to 5 relevant hashtags. One caption per line.`
          }
        ];

    const r = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.8
    });

    const text = r.choices?.[0]?.message?.content || "";
    return res.status(200).json({ captions: text, demo: false });
  } catch (e) {
    const status = e?.status || e?.response?.status;
    if (status === 429) {
      const lines = demoCaptions(tone).join("\n");
      return res.status(200).json({ captions: lines, demo: true, note: "Using demo captions due to API quota" });
    }
    console.error("API error:", e);
    return res.status(500).json({ error: e.message || "Server error" });
  }
}