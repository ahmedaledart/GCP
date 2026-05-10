import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from 'cors';
import fs from "fs";
import EventEmitter from "events";
import { createClient } from '@supabase/supabase-js';
// Initialize Supabase Admin for server-side operations
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

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

// API db stream removed for GitHub Pages compatibility

// --- API Price Update Implementation ---

app.post("/api/prices/update-all", async (req, res) => {
  try {
    // 1. Get active sources and mappings
    const { data: sources } = await supabase.from('api_sources').select('*').eq('is_active', true);
    const { data: mappings } = await supabase.from('commodity_api_mapping').select('*').eq('is_active', true);

    if (!sources || !mappings) {
      return res.status(404).json({ error: "No active sources or mappings found" });
    }

    let updatedCount = 0;
    const updateLogs: any[] = [];

    // 2. Iterate through segments/providers to batch requests if possible, otherwise individual
    for (const mapping of mappings) {
      const source = sources.find(s => s.provider === mapping.provider);
      if (!source) continue;

      try {
        // Implementation for a generic API provider (like Metal price API, Currency, etc.)
        // Construct URL: base_url + ... + api_symbol
        // This is a simplified proxy. In production, you'd have specific logic per provider.
        const apiUrl = `${source.base_url}?symbol=${mapping.api_symbol}&apikey=${process.env[source.api_key_name] || ''}`;
        
        const apiResponse = await fetch(apiUrl);
        const data: any = await apiResponse.json();

        if (apiResponse.ok && data) {
          // Extract price (example structure: different APIs have different path)
          const newPrice = data.price || data.rate || (data.rates && data.rates[mapping.api_symbol]);
          
          if (newPrice) {
            // Get current internal price
            const { data: currentItem } = await supabase.from('commodities').select('price').eq('symbol', mapping.symbol).single();
            const oldPrice = currentItem?.price || 0;

            // Calculate metrics
            const diff = newPrice - oldPrice;
            const pct = oldPrice > 0 ? (diff / oldPrice) * 100 : 0;
            const trend = diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral';

            // Upsert into commodities
            const { error: upsertError } = await supabase.from('commodities').upsert({
              symbol: mapping.symbol,
              price: newPrice,
              previous_price: oldPrice,
              change_value: parseFloat(diff.toFixed(4)),
              change_percent: parseFloat(pct.toFixed(2)),
              trend: trend,
              updated_at: new Date().toISOString()
            }, { onConflict: 'symbol' });

            if (upsertError) throw upsertError;

            // Log success
            await supabase.from('api_update_logs').insert({
              provider: mapping.provider,
              symbol: mapping.symbol,
              api_symbol: mapping.api_symbol,
              status: 'success',
              message: `Price updated to ${newPrice}`,
              raw_response: JSON.stringify(data)
            });

            updatedCount++;
          }
        } else {
          throw new Error(data.message || 'API responded with error');
        }
      } catch (err: any) {
        // Log failure
        await supabase.from('api_update_logs').insert({
          provider: mapping.provider,
          symbol: mapping.symbol,
          api_symbol: mapping.api_symbol,
          status: 'error',
          message: err.message,
          raw_response: null
        });
      }
    }

    res.json({ success: true, count: updatedCount });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/prices/test-source/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { data: source } = await supabase.from('api_sources').select('*').eq('id', id).single();
    
    if (!source) return res.status(404).json({ error: "Source not found" });

    const response = await fetch(source.base_url);
    // Even if it's 401/403, we check if the URL is reachable
    if (response.status < 500) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: `Source returned HTTP ${response.status}` });
    }
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
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
    
    // Simple interval for scheduled updates (e.g., check every 1 hour)
    // In a real environment, you might use node-cron for more precise control
    const ONE_HOUR = 60 * 60 * 1000;
    setInterval(async () => {
      console.log('Running scheduled price update...');
      try {
        // We can reuse the logic by calling the same internal logic or triggering a self-request
        // For simplicity in this demo, we'll just log it's starting
        // fetch(`http://localhost:${PORT}/api/prices/update-all`, { method: 'POST' });
      } catch (e) {
        console.error('Scheduled update failed', e);
      }
    }, ONE_HOUR);
  });
}

startServer();
