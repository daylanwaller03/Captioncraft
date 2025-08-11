import { openai } from "../../lib/openai";
import { supabase } from "../../lib/supabase";
import { getServerSession } from "next-auth";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const session = await getServerSession(req, res);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  const { description, tone } = req.body;

  // Track usage for free tier
  const { data: user } = await supabase
    .from("users")
    .select("usage_count, plan")
    .eq("id", session.user.id)
    .single();

  if (user.plan === "free" && user.usage_count >= 5) {
    return res.status(403).json({ error: "Free tier limit reached" });
  }

  const prompt = `Generate 3 catchy social media captions in a ${tone} tone for this: ${description}. Include 5 relevant hashtags.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.8
  });

  await supabase
    .from("users")
    .update({ usage_count: user.usage_count + 1 })
    .eq("id", session.user.id);

  res.status(200).json({ captions: completion.choices[0].message.content });
}
