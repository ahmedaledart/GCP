import express from 'express';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer } from 'ws';
import http from 'http';
import path from 'path';
import { commoditiesData } from './src/data/mockData.ts';

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  // Keep a mutable copy of the data for the simulation
  let currentData = [...commoditiesData];

  // Function to fetch real data from commodities-api.com
  const fetchRealEnergyData = async (retries = 3) => {
    const apiKey = process.env.COMMODITIES_API_KEY;
    if (!apiKey) {
      console.log('COMMODITIES_API_KEY is missing. Using simulated data.');
      return;
    }

    for (let i = 0; i < retries; i++) {
      try {
        // Fetching BRENT and WTI
        const response = await fetch(`https://commodities-api.com/api/latest?access_key=${encodeURIComponent(apiKey)}&base=USD&symbols=BRENT,WTI`, {
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        
        if (!response.ok) {
          if (response.status === 404) {
             console.error('API endpoint not found (404). Please check the API URL. Falling back to simulated data.');
             return; // Don't retry on 404
          }
          if (response.status === 401) {
             console.error('API key is invalid or unauthorized (401). Please check your COMMODITIES_API_KEY. Falling back to simulated data.');
             return; // Don't retry on 401
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result && result.data && result.data.rates) {
          const rates = result.data.rates;
          
          currentData = currentData.map(item => {
            if (item.id === 'brent' && rates.BRENT) {
              const realPrice = Number((1 / rates.BRENT).toFixed(2));
              return updateItemPrice(item, realPrice);
            }
            if (item.id === 'wti' && rates.WTI) {
              const realPrice = Number((1 / rates.WTI).toFixed(2));
              return updateItemPrice(item, realPrice);
            }
            return item;
          });
          
          console.log('Real energy data updated successfully.');
          return; // Success, exit the retry loop
        } else if (result && result.error) {
          console.error('API Error:', result.error);
          return; // API returned an error, don't retry DNS-style
        }
      } catch (error: any) {
        console.error(`Attempt ${i + 1} failed:`, error.message);
        if (i === retries - 1) {
          console.error('Max retries reached. Falling back to simulated data.');
        } else {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
      }
    }
  };

  // Helper to update item price and calculate changes
  const updateItemPrice = (item: any, newPrice: number) => {
    const changeAmount = Number((newPrice - item.prevClose).toFixed(2));
    const changePercent = Number(((changeAmount / item.prevClose) * 100).toFixed(2));
    
    return {
      ...item,
      price: newPrice,
      changeAmount,
      changePercent,
      trend: newPrice >= item.price ? 'up' : 'down',
      high: Math.max(item.high, newPrice),
      low: Math.min(item.low, newPrice),
      lastUpdate: new Date().toISOString(),
      history: [
        ...item.history.slice(1), 
        { 
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }), 
          price: newPrice 
        }
      ]
    };
  };

  // Initial fetch
  fetchRealEnergyData();
  // Fetch real data every 10 minutes
  setInterval(fetchRealEnergyData, 10 * 60 * 1000);

  // Simulation loop: Update prices every 2 seconds
  setInterval(() => {
    let updated = false;
    currentData = currentData.map(item => {
      // Only update open markets, and only 30% chance to update per tick
      if (item.statusAr === 'مغلق' || Math.random() > 0.3) return item;

      // Random price change between 1 to 7 cents (0.01 to 0.07)
      const changeCents = Math.floor(Math.random() * 7) + 1;
      const changeDirection = Math.random() > 0.5 ? 1 : -1;
      const change = (changeCents / 100) * changeDirection;
      
      const newPrice = Number((item.price + change).toFixed(2));
      updated = true;
      return updateItemPrice(item, newPrice);
    });

    if (updated) {
      const message = JSON.stringify({ type: 'MARKET_UPDATE', data: currentData });
      wss.clients.forEach(client => {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(message);
        }
      });
    }
  }, 2000);

  wss.on('connection', (ws) => {
    // Send initial data immediately upon connection
    ws.send(JSON.stringify({ type: 'MARKET_UPDATE', data: currentData }));
  });

  // API Route for health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', connections: wss.clients.size });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Static serving for production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
