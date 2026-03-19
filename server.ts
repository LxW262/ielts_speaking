import dotenv from "dotenv";
dotenv.config();
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";

try {
  const devEnvPath = "/app/.dev.env.json";
  if (fs.existsSync(devEnvPath)) {
    const devEnv = JSON.parse(fs.readFileSync(devEnvPath, "utf-8"));
    if (devEnv.GEMINI_API_KEY) {
      process.env.GEMINI_API_KEY = devEnv.GEMINI_API_KEY;
    }
  }
} catch (e) {
  console.error("Failed to read /app/.dev.env.json", e);
}

// Import our Vercel-style API routes
import generateHandler from "./api/generate.js";
import ttsHandler from "./api/tts.js";
import keywordsHandler from "./api/keywords.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  console.log("Starting server... GEMINI_API_KEY present:", !!process.env.GEMINI_API_KEY);
  console.log("GEMINI_API_KEY length:", process.env.GEMINI_API_KEY?.length);

  // Middleware to parse JSON bodies
  app.use(express.json());

  // Map /api routes to our Vercel handlers
  app.all("/api/v1/generate", (req, res) => generateHandler(req, res));
  app.all("/api/v1/tts", (req, res) => ttsHandler(req, res));
  app.all("/api/v1/keywords", (req, res) => keywordsHandler(req, res));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
