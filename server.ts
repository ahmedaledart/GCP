import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from 'cors';
import fs from "fs";
import EventEmitter from "events";

const app = express();
const PORT = 3000;
const DB_PATH = path.join(process.cwd(), "db.json");
const dbEvents = new EventEmitter();

app.use(express.json({ limit: '10mb' }));
app.use(cors());

// Database Routes
app.get("/api/db", (req, res) => {
  try {
    if (!fs.existsSync(DB_PATH)) {
      return res.json({});
    }
    const data = fs.readFileSync(DB_PATH, "utf-8");
    res.json(JSON.parse(data));
  } catch (e) {
    res.status(500).json({ error: "Failed to read database" });
  }
});

app.post("/api/db", (req, res) => {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(req.body, null, 2));
    dbEvents.emit('update');
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to save database" });
  }
});

app.get("/api/db/stream", (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  
  const sendUpdate = () => {
    res.write('data: update\n\n');
  };
  
  dbEvents.on('update', sendUpdate);
  
  req.on('close', () => {
    dbEvents.off('update', sendUpdate);
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
