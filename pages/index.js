import { useState } from "react";

export default function Home() {
  const [imageUrl, setImageUrl] = useState("");
  const [tone, setTone] = useState("funny");
  const [captions, setCaptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setCaptions([]);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageUrl, tone }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Failed to generate caption");
      }

      const data = await res.json();
      setCaptions(data.captions || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>CaptionCraft</h1>
      <input
        type="text"
        placeholder="Paste an image URL"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
        style={{ width: "80%", padding: "8px", marginBottom: "10px" }}
      />
      <div>
        <select value={tone} onChange={(e) => setTone(e.target.value)}>
          <option value="funny">funny</option>
          <option value="luxury">luxury</option>
          <option value="romantic">romantic</option>
          <option value="adventurous">adventurous</option>
        </select>
      </div>
      <button onClick={handleGenerate} disabled={loading}>
        {loading ? "Generating..." : "Generate Caption"}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <div>
        {captions.map((caption, idx) => (
          <div key={idx}>
            <p>{caption}</p>
            <button
              onClick={() => navigator.clipboard.writeText(caption)}
              style={{ marginRight: "5px" }}
            >
              Copy
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}