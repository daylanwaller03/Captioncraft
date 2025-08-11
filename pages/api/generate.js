import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function demoCaptions(tone, imageUrl) {
  const vibe = tone || "funny";
  const short = (s) => s.replace(/\s+/g, " ").trim();
  return [
    short(`Vacation vibes. ${vibe} caption time. #Travel #Wanderlust #GoodTimes #PhotoOfTheDay #Memories`),
    short(`Caught the moment just right. ${vibe} mood only. #Weekend #HappyPlace #OOTD #InstaDaily #NoFilter`),
    short(`Living for scenes like this. ${vibe} energy. #Sunset #Chill #Blessed #BucketList #Life`),
  ];
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { imageUrl = "", tone = "funny" } = req.body || {};
  if (!imageUrl.trim()) return res.status(400).json({ error: "Missing imageUrl" });

  try {
    const messages = [
      {
        role: "user",
        content: [
          { type: "text", text: `Write 3 short social captions in a ${tone} tone for this image. Include 3 to 5 relevant hashtags. One caption per line.` },
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
    return res.status(200).json({ captions: text, demo: false });
  } catch (e) {
    // If quota is exhausted, return demo captions instead of failing
    const status = e?.status || e?.response?.status;
    if (status === 429) {
      const lines = demoCaptions(tone, imageUrl).join("\n");
      return res.status(200).json({
        captions: lines,
        demo: true,
        note: "Using demo captions due to API quota"
      });
    }
    console.error("API error:", e);
    return res.status(500).json({ error: e.message || "Server error" });
  }
}