// pages/api/generate.js
import OpenAI from "openai";

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Simple local captions for fallback
function localCaptions(tone = "funny") {
  const bank = {
    funny: [
      "POV: winning golden hour about this moment. #VibesOnly #LOL #NoFilter",
      "Just me being dramatic - thriving chaos about this moment. #LOL #Relatable #NoFilter",
      "Low effort pic, high effort vibes - thriving golden hour about this moment. #VibesOnly #JustKidding #LOL",
    ],
    luxury: [
      "Living lavish - basking in pure elegance. #LuxuryLife #FiveStar #VIP",
      "Taste of the good life - rare moments only. #HighEnd #Exclusive #Opulence",
      "Own the view - first class everything. #Premium #GoldStandard #SuiteLife",
    ],
    romantic: [
      "Soft light and softer hearts. #Love #Together #YouAndMe",
      "Holding on to this moment. #Forever #Soulmates #Warmth",
      "You, me, and this view. #Romance #DateNight #HeartEyes",
    ],
    adventurous: [
      "Chasing horizons - one step at a time. #Adventure #Explore #Wander",
      "Wild paths and wide smiles. #TrailLife #OutThere #BucketList",
      "Built for views like this. #SeekMore #GoFar #NoLimits",
    ],
  };
  return bank[tone] || bank.funny;
}

function isQuota(err) {
  const s = err?.status || err?.response?.status;
  const msg = (err?.message || err?.response?.data?.error?.message || "").toLowerCase();
  const type = (err?.response?.data?.error?.type || "").toLowerCase();
  return s === 429 || msg.includes("quota") || type.includes("insufficient_quota");
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { imageUrl = "", tone = "funny" } = req.body || {};

  // No key - use local captions
  if (!client) {
    return res.status(200).json({ captions: localCaptions(tone), demo: true });
  }

  try {
    // Build messages for image based captioning
    const messages = [
      {
        role: "user",
        content: [
          { type: "text", text: `Write 3 short social captions in a ${tone} tone for this image. Include 3 to 5 relevant hashtags. One caption per line.` },
          ...(imageUrl
            ? [{ type: "image_url", image_url: { url: imageUrl } }]
            : [{ type: "text", text: "No image provided - describe something scenic." }]),
        ],
      },
    ];

    const r = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.8,
    });

    const text = r.choices?.[0]?.message?.content || "";
    const lines = text
      .split("\n")
      .map((l) => l.replace(/^\s*[\-\*\d\.\)]\s*/, "").trim())
      .filter(Boolean);

    // If API returned nothing, fall back
    if (!lines.length) {
      return res.status(200).json({ captions: localCaptions(tone), demo: true });
    }

    return res.status(200).json({ captions: lines, demo: false });
  } catch (err) {
    console.error("OpenAI error:", err);
    // Quota or any error - still return captions so UI keeps working
    if (isQuota(err)) return res.status(200).json({ captions: localCaptions(tone), demo: true });
    return res.status(200).json({ captions: localCaptions(tone), demo: true });
  }
}