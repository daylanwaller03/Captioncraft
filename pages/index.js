import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());

// Get API key from environment (Vercel Settings → Environment Variables)
const openaiApiKey = process.env.OPENAI_API_KEY;

// Simple offline captions for fallback
const offlineCaptions = (tone) => [
  `POV: - winning golden hour about this moment. #VibesOnly #LOL #NoFilter`,
  `Just me being dramatic - thriving chaos about this moment. #LOL #Relatable #NoFilter`,
  `Low effort pic, high effort vibes - thriving golden hour about this moment. #VibesOnly #JustKidding #LOL`
];

app.post("/api/generate