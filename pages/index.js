import { useState } from "react";

export default function Home() {
  const [imageUrl, setImageUrl] = useState("");
  const [tone, setTone] = useState("funny");
  const [captions, setCaptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [offline, setOffline] = useState(false); // shows the banner

  async function handleGenerate() {
    setLoading(true);
    setError("");
    setCaptions([]);
    setOffline(false);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl, tone })
      });

      // if server returns 429 or a non JSON body, try to read text then throw
      if (!res.ok && res.status !== 200) {
        const text = await res.text();
        throw new Error(text || `Request failed with ${res.status}`);
      }

      const data = await res.json();

      // API route always returns an array `captions` and a boolean `demo`
      setCaptions(Array.isArray(data.captions) ? data.captions : []);
      setOffline(Boolean(data.demo));
    } catch (e) {
      setError(e.message || "Something went wrong");
      setOffline(true); // show banner if we hit any unexpected client error
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif", maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 12 }}>CaptionCraft</h1>

      <input
        type="text"
        placeholder="Paste an image URL"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
        style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
      />

      <div style={{ marginTop: 10 }}>
        <label htmlFor="tone">Tone</label>{" "}
        <select id="tone" value={tone} onChange={(e) => setTone(e.target.value)}>
          <option value="funny">funny</option>
          <option value="luxury">luxury</option>
          <option value="romantic">romantic</option>
          <option value="adventurous">adventurous</option>
        </select>
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading}
        style={{ marginTop: 12, padding: "10px 16px", borderRadius: 8 }}
      >
        {loading ? "Generating..." : "Generate Caption"}
      </button>

      {/* Offline banner */}
      {offline && (
        <div
          style={{
            marginTop: 12,
            padding: 10,
            background: "#fff6e5",
            border: "1px solid #ffd18a",
            color: "#7a4b00",
            borderRadius: 8
          }}
        >
          Offline mode - using local captions. Add billing or a fresh API key to switch back to live captions.
        </div>
      )}

      {error && <p style={{ color: "red", marginTop: 10 }}>{error}</p>}

      <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
        {captions.map((c, i) => (
          <div key={i} style={{ border: "1px solid #eee", padding: 10, borderRadius: 8 }}>
            <p style={{ margin: 0 }}>{c}</p>
            <div style={{ marginTop: 8 }}>
              <button onClick={() => navigator.clipboard.writeText(c)}>Copy</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}