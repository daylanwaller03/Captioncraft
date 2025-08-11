import { useState } from "react";

export default function Dashboard() {
  const [description, setDescription] = useState("");
  const [tone, setTone] = useState("funny");
  const [captions, setCaptions] = useState([]);

  const generateCaptions = async () => {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description, tone })
    });
    const data = await res.json();
    if (data.captions) {
      setCaptions(data.captions.split("\n").filter(Boolean));
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Generate Captions</h2>
      <textarea
        className="border w-full p-2 mb-3"
        placeholder="Describe your photo/video..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <select
        value={tone}
        onChange={(e) => setTone(e.target.value)}
        className="border p-2 mb-3"
      >
        <option value="funny">Funny</option>
        <option value="inspirational">Inspirational</option>
        <option value="luxury">Luxury</option>
      </select>
      <button
        onClick={generateCaptions}
        className="bg-green-500 text-white px-4 py-2 rounded"
      >
        Generate
      </button>

      <div className="mt-6">
        {captions.map((cap, i) => (
          <div key={i} className="border p-3 my-2">
            {cap} <button onClick={() => navigator.clipboard.writeText(cap)}>Copy</button>
          </div>
        ))}
      </div>
    </div>
  );
}