import { useState } from "react";

export default function Home() {
  const [imageUrl, setImageUrl] = useState("");
  const [tone, setTone] = useState("funny");
  const [captions, setCaptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setLoading(true);
    setError("");
    setCaptions([]);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl, tone })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      const lines = data.captions.split("\n").filter(x => x.trim());
      setCaptions(lines);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: 16, fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 42, fontWeight: 800 }}>CaptionCraft</h1>

      <input
        type="url"
        placeholder="Paste an image URL"
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

      {error && <p style={{ color: "red", marginTop: 12 }}>{error}</p>}

      <div style={{ marginTop: 16 }}>
        {captions.map((c, i) => (
          <div key={i} style={{ border: "1px solid #eee", padding: 10, marginBottom: 8, borderRadius: 6 }}>
            {c}
            <button style={{ float: "right" }} onClick={() => navigator.clipboard.writeText(c)}>Copy</button>
          </div>
        ))}
      </div>
    </div>
  );
}