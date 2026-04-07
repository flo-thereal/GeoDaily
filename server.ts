import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';

// Conditionally import database routes (only if DATABASE_URL is set)
const USE_DATABASE = !!process.env.DATABASE_URL;

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// Health check
app.get("/api/health", async (req, res) => {
  let dbConnected = null;
  if (USE_DATABASE) {
    const { testConnection } = await import('./server/drizzle/index');
    dbConnected = await testConnection();
  }
  res.json({ 
    status: "ok",
    database: USE_DATABASE ? (dbConnected ? "connected" : "disconnected") : "not configured",
    mode: process.env.NODE_ENV || "development",
    devAuthBypass: process.env.DEV_AUTH_BYPASS === 'true',
  });
});

// Setup routes based on mode
async function setupRoutes() {
  if (USE_DATABASE) {
    // Full database-backed routes
    const challengesRouter = (await import('./server/routes/challenges')).default;
    const usersRouter = (await import('./server/routes/users')).default;
    const countriesRouter = (await import('./server/routes/countries')).default;
    
    app.use('/api', challengesRouter);
    app.use('/api/users', usersRouter);
    app.use('/api/countries', countriesRouter);
    console.log("Database mode: Using PostgreSQL for data persistence");
  } else {
    // Fallback: In-memory mode (original implementation for local dev without Docker)
    console.log("Standalone mode: Using in-memory cache (no database)");
    
    const dailyTasksCache: Record<string, any[]> = {};

    app.get("/api/daily", async (req, res) => {
    const date = req.query.date as string;
    if (!date) {
      return res.status(400).json({ error: "Date is required" });
    }

    if (dailyTasksCache[date]) {
      return res.json(dailyTasksCache[date]);
    }

    try {
      const ai = new GoogleGenAI({});
      let seed = 0;
      for (let i = 0; i < date.length; i++) {
        seed = (seed << 5) - seed + date.charCodeAt(i);
        seed |= 0;
      }
      seed = Math.abs(seed);

      const prompt = `Generate 5 geography quiz questions for a daily challenge for the date ${date}. 
      Mix the types: 'flag' (guess country from flag), 'capital' (guess capital of country), 'map' (guess country from description/location).
      For 'flag' type, provide the country name in 'correctAnswer' and 3 other country names in 'options'. The 'question' should be "Which country's flag is this?". Provide the 2-letter ISO country code in 'imageUrl' so I can fetch the flag.
      For 'capital' type, provide the country name in 'question' (e.g., "What is the capital of France?"), the capital in 'correctAnswer', and 3 other cities in 'options'.
      For 'map' type, provide a description of a specific city, landmark, or country in 'question' (e.g., "Where is the Eiffel Tower located?"). Provide the exact lat/lng in 'mapCoordinates'. 'correctAnswer' is the name of the place. 'options' can be empty.
      Make the questions interesting and varied.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          seed: seed,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['flag', 'capital', 'map'] },
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.STRING },
                imageUrl: { type: Type.STRING },
                mapCoordinates: {
                  type: Type.OBJECT,
                  properties: { lat: { type: Type.NUMBER }, lng: { type: Type.NUMBER } }
                }
              },
              required: ["id", "type", "question", "correctAnswer"]
            }
          }
        }
      });

      if (response.text) {
        const tasks = JSON.parse(response.text);
        const processedTasks = tasks.map((task: any) => {
          if (task.options && task.options.length > 0) {
            const uniqueOptions = Array.from(new Set([...task.options, task.correctAnswer]));
            task.options = uniqueOptions.sort(() => Math.random() - 0.5);
          }
          return task;
        });
        dailyTasksCache[date] = processedTasks;
        return res.json(processedTasks);
      }
      
      res.status(500).json({ error: "Failed to generate tasks" });
    } catch (error: any) {
      console.error("Failed to generate tasks:", error);
      if (error?.message?.includes("API key not valid") || error?.status === 400 || error?.status === 403) {
        return res.status(401).json({ error: "Invalid or missing Gemini API key." });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/practice", async (req, res) => {
    const type = req.query.type as string;
    if (!type) {
      return res.status(400).json({ error: "Type is required" });
    }

    try {
      const ai = new GoogleGenAI({});
      let prompt = '';
      if (type === 'flags') {
        prompt = `Generate 5 geography quiz questions. The type must be 'flag'. Provide the country name in 'correctAnswer' and 3 other country names in 'options'. The 'question' should be "Which country's flag is this?". Provide the 2-letter ISO country code in 'imageUrl' so I can fetch the flag.`;
      } else if (type === 'capitals') {
        prompt = `Generate 5 geography quiz questions. The type must be 'capital'. Provide the country name in 'question' (e.g., "What is the capital of France?"), the capital in 'correctAnswer', and 3 other cities in 'options'.`;
      } else if (type === 'map') {
        prompt = `Generate 5 geography quiz questions. The type must be 'map'. Provide a description of a specific city, landmark, or country in 'question' (e.g., "Where is the Eiffel Tower located?"). Provide the exact lat/lng in 'mapCoordinates'. 'correctAnswer' is the name of the place. 'options' can be empty.`;
      } else {
        return res.status(400).json({ error: "Invalid type" });
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['flag', 'capital', 'map'] },
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.STRING },
                imageUrl: { type: Type.STRING },
                mapCoordinates: {
                  type: Type.OBJECT,
                  properties: { lat: { type: Type.NUMBER }, lng: { type: Type.NUMBER } }
                }
              },
              required: ["id", "type", "question", "correctAnswer"]
            }
          }
        }
      });

      if (response.text) {
        const tasks = JSON.parse(response.text);
        const processedTasks = tasks.map((task: any) => {
          if (task.options && task.options.length > 0) {
            const uniqueOptions = Array.from(new Set([...task.options, task.correctAnswer]));
            task.options = uniqueOptions.sort(() => Math.random() - 0.5);
          }
          return task;
        });
        return res.json(processedTasks);
      }
      
      res.status(500).json({ error: "Failed to generate tasks" });
    } catch (error: any) {
      console.error("Failed to generate practice tasks:", error);
      if (error?.message?.includes("API key not valid") || error?.status === 400 || error?.status === 403) {
        return res.status(401).json({ error: "Invalid or missing Gemini API key." });
      }
      res.status(500).json({ error: "Internal server error" });
    }
    });

    // Basic countries endpoint for standalone mode
    const standaloneCountries = [
      { code: 'FR', name: 'France', region: 'Europe', capital: 'Paris', population: 67390000, areaKm2: 643801, languages: ['French'], flagEmoji: '🇫🇷', borders: ['BE', 'DE', 'IT', 'ES'], coordinates: { lat: 46.2276, lng: 2.2137 }, currency: { code: 'EUR', name: 'Euro', symbol: '€' } },
      { code: 'DE', name: 'Germany', region: 'Europe', capital: 'Berlin', population: 83240000, areaKm2: 357386, languages: ['German'], flagEmoji: '🇩🇪', borders: ['FR', 'PL', 'AT', 'CZ'], coordinates: { lat: 51.1657, lng: 10.4515 }, currency: { code: 'EUR', name: 'Euro', symbol: '€' } },
      { code: 'JP', name: 'Japan', region: 'Asia', capital: 'Tokyo', population: 125800000, areaKm2: 377975, languages: ['Japanese'], flagEmoji: '🇯🇵', borders: [], coordinates: { lat: 36.2048, lng: 138.2529 }, currency: { code: 'JPY', name: 'Yen', symbol: '¥' } },
      { code: 'BR', name: 'Brazil', region: 'South America', capital: 'Brasília', population: 214300000, areaKm2: 8515767, languages: ['Portuguese'], flagEmoji: '🇧🇷', borders: ['AR', 'BO', 'CO', 'PY', 'PE', 'UY', 'VE'], coordinates: { lat: -14.235, lng: -51.9253 }, currency: { code: 'BRL', name: 'Real', symbol: 'R$' } },
      { code: 'US', name: 'United States', region: 'North America', capital: 'Washington, D.C.', population: 331900000, areaKm2: 9833520, languages: ['English'], flagEmoji: '🇺🇸', borders: ['CA', 'MX'], coordinates: { lat: 37.0902, lng: -95.7129 }, currency: { code: 'USD', name: 'Dollar', symbol: '$' } },
      { code: 'AU', name: 'Australia', region: 'Oceania', capital: 'Canberra', population: 25690000, areaKm2: 7692024, languages: ['English'], flagEmoji: '🇦🇺', borders: [], coordinates: { lat: -25.2744, lng: 133.7751 }, currency: { code: 'AUD', name: 'Australian Dollar', symbol: '$' } },
      { code: 'EG', name: 'Egypt', region: 'Africa', capital: 'Cairo', population: 102300000, areaKm2: 1002450, languages: ['Arabic'], flagEmoji: '🇪🇬', borders: ['LY', 'SD', 'IL', 'PS'], coordinates: { lat: 26.8206, lng: 30.8025 }, currency: { code: 'EGP', name: 'Pound', symbol: '£' } },
      { code: 'IN', name: 'India', region: 'Asia', capital: 'New Delhi', population: 1393000000, areaKm2: 3287263, languages: ['Hindi', 'English'], flagEmoji: '🇮🇳', borders: ['PK', 'CN', 'NP', 'BD', 'MM'], coordinates: { lat: 20.5937, lng: 78.9629 }, currency: { code: 'INR', name: 'Rupee', symbol: '₹' } },
      { code: 'IT', name: 'Italy', region: 'Europe', capital: 'Rome', population: 59550000, areaKm2: 301340, languages: ['Italian'], flagEmoji: '🇮🇹', borders: ['FR', 'CH', 'AT', 'SI'], coordinates: { lat: 41.8719, lng: 12.5674 }, currency: { code: 'EUR', name: 'Euro', symbol: '€' } },
      { code: 'MX', name: 'Mexico', region: 'North America', capital: 'Mexico City', population: 128900000, areaKm2: 1964375, languages: ['Spanish'], flagEmoji: '🇲🇽', borders: ['US', 'GT', 'BZ'], coordinates: { lat: 23.6345, lng: -102.5528 }, currency: { code: 'MXN', name: 'Peso', symbol: '$' } },
      { code: 'ZA', name: 'South Africa', region: 'Africa', capital: 'Pretoria', population: 59390000, areaKm2: 1221037, languages: ['English', 'Afrikaans', 'Zulu'], flagEmoji: '🇿🇦', borders: ['NA', 'BW', 'ZW', 'MZ', 'SZ', 'LS'], coordinates: { lat: -30.5595, lng: 22.9375 }, currency: { code: 'ZAR', name: 'Rand', symbol: 'R' } },
      { code: 'CN', name: 'China', region: 'Asia', capital: 'Beijing', population: 1412000000, areaKm2: 9596960, languages: ['Mandarin'], flagEmoji: '🇨🇳', borders: ['RU', 'MN', 'KZ', 'KG', 'TJ', 'AF', 'PK', 'IN', 'NP', 'BT', 'MM', 'LA', 'VN', 'KP'], coordinates: { lat: 35.8617, lng: 104.1954 }, currency: { code: 'CNY', name: 'Yuan', symbol: '¥' } },
    ];

    app.get("/api/countries", (req, res) => {
      const region = req.query.region as string;
      const search = req.query.search as string;
      
      let filtered = standaloneCountries;
      if (region && region !== 'All') {
        filtered = filtered.filter(c => c.region === region);
      }
      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(c => 
          c.name.toLowerCase().includes(s) || 
          c.capital.toLowerCase().includes(s)
        );
      }
      res.json(filtered);
    });

    app.get("/api/countries/meta/regions", (req, res) => {
      const regions = [...new Set(standaloneCountries.map(c => c.region))];
      res.json(regions.map(r => ({ region: r, count: standaloneCountries.filter(c => c.region === r).length })));
    });

    app.get("/api/countries/:code", (req, res) => {
      const country = standaloneCountries.find(c => c.code === req.params.code);
      if (country) {
        res.json(country);
      } else {
        res.status(404).json({ error: "Country not found" });
      }
    });
  }
}

async function startServer() {
  console.log("=== GeoDaily Server ===");
  console.log("GEMINI_API_KEY exists:", !!process.env.GEMINI_API_KEY);
  console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
  console.log("DEV_AUTH_BYPASS:", process.env.DEV_AUTH_BYPASS === 'true');
  
  // Setup API routes
  await setupRoutes();
  
  // Start daily challenge scheduler if using database
  if (USE_DATABASE && process.env.GEMINI_API_KEY) {
    const { startScheduler } = await import('./server/scheduler');
    startScheduler();
  }
  
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
