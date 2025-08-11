function demoCaptions(tone){
  const vibe = tone || "funny";
  return [
    `Vacation vibes. ${vibe} caption time. #Travel #Wanderlust #GoodTimes #PhotoOfTheDay #Memories`,
    `Caught the moment just right. ${vibe} mood only. #Weekend #HappyPlace #InstaDaily #NoFilter`,
    `Living for scenes like this. ${vibe} energy. #Sunset #Chill #Blessed #BucketList #Life`,
  ];
}

async function generate() {
  setLoading(true);
  setError("");
  setCaptions([]);
  setDemoUsed(false);
  try {
    const body = mode === "image" ? { imageUrl, tone } : { description, tone };
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    // If server still responds 429, use client-side demo captions
    if (res.status === 429) {
      setCaptions(demoCaptions(tone));
      setDemoUsed(true);
      return;
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed");
    const lines = (data.captions || "").split("\n").filter(x => x.trim());
    setCaptions(lines);
    setDemoUsed(Boolean(data.demo));
  } catch (e) {
    setError(e.message);
  } finally {
    setLoading(false);
  }
}