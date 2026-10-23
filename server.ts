import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Aucune route d'API métier ici (l'ancien proxy IA, faille S7, a été retiré :
// D76). La Cloud Function `api` ne sert plus que /api/health.
// Ce serveur ne sert que l'application (développement : Vite ; ancienne
// production AI Studio : fichiers statiques de dist/).

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.all("/api/*", (req, res) => {
  res.status(410).json({ error: "moved", detail: "Utiliser la fonction api (Cloud Functions)." });
});

// Vite middleware setup for Development or Static serving for Production
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

setupServer();
