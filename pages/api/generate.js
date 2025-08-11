// pages/api/generate.js
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// local captions used as fallback when API quota is hit or any error happens
function localCaptions(tone = "funny", description = "", imageUrl = "") {
  const bank = {
    funny: {
      openers: ["Low effort pic, high effort vibes", "POV:", "Just me being dramatic"],
      verbs: ["serving", "thriving", "glowing", "winning"],
      nouns: ["chaos", "main character energy", "good hair day", "golden hour"],
      tags: ["#LOL", "#Relatable", "#NoFilter", "#VibesOnly", "#JustKidding"]
    },
    inspirational: {
      openers: ["Chasing dreams", "On the journey", "Every step counts"],
      verbs: ["embracing", "becoming", "growing into", "unlocking"],
      nouns: ["my potential", "the best version of me", "new horizons", "possibilities"],
      tags: ["#Motivation", "#Goals", "#Believe", "#PositiveVibes", "#SuccessMindset"]
    },
    luxury: {
      openers: ["Living lavish", "A taste of the good life", "Opulence only"],
      verbs: ["sipping", "enjoying", "basking in", "owning"],
      nouns: ["golden sunsets", "rare moments", "first class views", "pure elegance"],
      tags: ["#LuxuryLife", "#Exclusivity", "#HighEnd", "#VIP", "#FiveStar"]
    },
    casual: {
      openers: ["Just a random Tuesday", "Keeping it chill", "Nothing fancy"],
      verbs: ["enjoying", "taking in", "relaxing with", "soaking up"],
      nouns: ["the little things", "the moment", "simple joys", "today's vibes"],
      tags: ["#Chill", "#EverydayLife", "#GoodTimes", "#SimpleJoys", "#LifeAsItIs"]
    }
  };

  const set = bank[tone] || bank.funny;
  const subject = description || (imageUrl ? "this moment" : "life");

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const tagStr = () => set.tags.slice().sort(() => 0.5 - Math.random()).slice(0, 3).join(" ");

  return [
    `${pick(set.openers)} - ${pick(set.verbs)} ${pick(set.nouns)} about ${subject}. ${tagStr()}`,
    `${pick(set.openers)} - ${pick(set.verbs)} ${pick(set.nouns)} about ${subject}. ${tagStr()}`,
    `${pick(set.openers)} - ${pick(set.verbs)} ${pick(set.nouns)} about ${subject}. ${tagStr()}`
  ];
}

function isQuotaError(err) {
  const status = err?.status || err?.response?.status;
  const msg = (err?.message || err?.response?.data?.error?.message || "").toLowerCase();
  const type = (err?.response?.data?.error?.type || "").toLowerCase();
  return status === 429 || msg.includes("quota") || type.includes("insufficient_quota");
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

    if (!text.trim()) {
      const captions = localCaptions(tone, description, imageUrl).join("\n");
      return res.status(200).json({ captions, demo: true, note: "Local fallback used - empty API response" });
    }

    return res.status(200).json({ captions: text, demo: false });
  } catch (err) {
    // quota or any other error - still return captions so UI never breaks
    const captions = localCaptions(tone, description, imageUrl).join("\n");
    const note = isQuotaError(err)
      ? "Local fallback used - API quota"
      : "Local fallback used - API error";
    console.error("OpenAI error:", err);
    return res.status(200).json({ captions, demo: true, note });
  }
}