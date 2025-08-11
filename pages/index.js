import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "cc.history.v1";

// simple local caption generator for offline mode
function localCaptions({ tone, description = "", imageUrl = "" }) {
  const vibes = {
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

  const set = vibes[tone] || vibes.funny;
  const captions = Array.from({ length: 3 }, () => {
    const opener = set.openers[Math.floor(Math.random() * set.openers.length)];
    const verb = set.verbs[Math.floor(Math.random() * set.verbs.length)];
    const noun = set.nouns[Math.floor(Math.random() * set.nouns.length)];
    const tags = set.tags.sort(() => 0.5 - Math.random()).slice(0, 3).join(" ");
    const subject = description || (imageUrl ? "this moment" : "life");
    return `${opener} - ${verb} ${noun} about ${subject}. ${tags}`;
  });

  return captions;
}

function loadHistory() {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}
function saveHistory(items) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export default function Home() {
  const [mode, setMode] = useState("image"); // "image" or "text"
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [tone, setTone] = useState("funny");
  const [captions, setCaptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [demoUsed, setDemoUsed] = useState(false);

  useEffect(() => { setHistory(loadHistory()); }, []);

  function addToHistory(caption) {
    const item = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      mode,
      imageUrl: mode === "image" ? imageUrl : "",
      description: mode === "text" ? description : "",
      tone,
      caption
    };
    const next = [item, ...history].slice(0, 200);
    setHistory(next);
    saveHistory(next);
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

      // client side safety net for quota or rate limit
      if (res.status === 429) {
        setCaptions(localCaptions({ tone, description, imageUrl }));
        setDemoUsed(true);
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      const lines = (data.captions || "").split("\n").filter(x => x.trim());
      // if server returned empty for any reason, use local captions
      if (!lines.length) {
        setCaptions(localCaptions({ tone, description, imageUrl }));
        setDemoUsed(true);
      } else {
        setCaptions(lines);
        setDemoUsed(Boolean(data.demo));
      }
    } catch (e) {
      // on any unexpected error, fall back locally so the app still works
      setCaptions(localCaptions({ tone, description, imageUrl }));
      setDemoUsed(true);
      setError("");
    } finally {
      setLoading(false);
    }
  }

  const canGenerate = mode === "image" ? !!imageUrl.trim() : !!description.trim();

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: 16, fontFamily: "sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, margin: 0 }}>CaptionCraft</h1>
        <Link href="/history"><button>History</button></Link>
      </header>

      {/* Mode toggle */}
      <div style={{ marginTop: 12, display: "flex", gap: 16 }}>
        <label><input type="radio" name="mode" value="image" checked={mode === "image"} onChange={() => setMode("image")} /> Image URL</label>
        <label><input type="radio" name="mode" value="text" checked={mode === "text"} onChange={() => setMode("text")} /> Text description</label>
      </div>

      {mode === "image" ? (
        <>
          <input
            type="url"
            placeholder="Paste a direct image URL ending with .jpg or .png"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 8, marginTop: 12 }}
          />
          {imageUrl && (
            <div style={{ marginTop: 12 }}>
              <img src={imageUrl} alt="preview" style={{ maxWidth: "100%", borderRadius: 8 }} />
            </div>
          )}
        </>
      ) : (
        <textarea
          rows={4}
          placeholder="Describe your photo or video"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 8, marginTop: 12 }}
        />
      )}

      <div style={{ marginTop: 8 }}>
        <label style={{ marginRight: 8 }}>Tone</label>
        <select value={tone} onChange={(e) => setTone(e.target.value)}>
          <option value="funny">funny</option>
          <option value="inspirational">inspirational</option>
          <option value="luxury">luxury</option>
          <option value="casual">casual</option>
        </select>
      </div>

      <button onClick={generate} disabled={loading || !canGenerate} style={{ marginTop: 12, padding: "10px 16px", borderRadius: 8 }}>
        {loading ? "Generating..." : "Generate Caption"}
      </button>

      {demoUsed && (
        <p style={{ color: "#b26b00", marginTop: 10 }}>
          Offline mode - showing locally generated captions. Add billing or a fresh API key to switch back to live captions.
        </p>
      )}
      {error && <p style={{ color: "red", marginTop: 10 }}>{error}</p>}

      <div style={{ marginTop: 16 }}>
        {captions.map((c, i) => (
          <div key={i} style={{ border: "1px solid #eee", padding: 10, marginBottom: 8, borderRadius: 6 }}>
            {c}
            <div style={{ float: "right", display: "flex", gap: 8 }}>
              <button onClick={() => navigator.clipboard.writeText(c)}>Copy</button>
              <button onClick={() => addToHistory(c)}>Save</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}