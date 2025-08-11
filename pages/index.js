import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "cc.history.v1";

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
  const [imageUrl, setImageUrl] = useState("");
  const [tone, setTone] = useState("funny");
  const [captions, setCaptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);

  useEffect(() => { setHistory(loadHistory()); }, []);

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

  function addToHistory(caption) {
    const item = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      imageUrl,
      tone,
      caption
    };
    const