import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "cc.history.v1";
const loadHistory = () => {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
};
const saveHistory = (items) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

export default function Home() {
  const [imageUrl, setImageUrl] = useState("");
  const [tone, setTone] = useState("funny");
  const [captions, setCaptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [demoUsed, setDemoUsed] = useState(false);

  useEffect(() => { setHistory(loadHistory()); }, []);

  async function generate() {
    setLoading(true);
    setError("");
    setCaptions([]);
    setDemoUsed(false);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl, tone })
      });
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

  function addToHistory(caption) {
    const item = { id: crypto.randomUUID(), createdAt: Date.now(), imageUrl, tone, caption };
    const next = [item, ...history].slice(0, 200);
    setHistory(next);
    saveHistory(next);
  }

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: 16, fontFamily: "sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, margin: 0 }}>CaptionCraft</h1>
        <Link href="/history"><button>History</button></Link>
      </header>

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

      <div style={{ marginTop: 8 }}>
        <label style={{ marginRight: 8 }}>Tone</label>
        <select value={tone} onChange={(e) => setTone(e.target.value)}>
          <option value="funny">funny</option>
          <option value="inspirational">inspirational</option>
          <option value="luxury">luxury</option>
          <option value="casual">casual</option>
        </select>
      </div>

      <button onClick={generate} disabled={loading || !imageUrl} style={{ marginTop: 12, padding: "10px 16px", borderRadius: 8 }}>
        {loading ? "Generating..." : "Generate Caption"}
      </button>

      {demoUsed && (
        <p style={{ color: "#b26b00", marginTop: 10 }}>
          Demo captions shown because API quota is exhausted. Add billing or a fresh key to get real captions.
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