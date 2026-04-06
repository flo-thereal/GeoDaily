import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';

const app = express();
const PORT = 3000;

// In-memory cache for daily tasks (Date string YYYY-MM-DD -> Tasks)
const dailyTasksCache: Record<string, any[]> = {};

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/daily", async (req, res) => {
  const date = req.query.date as string;
  if (!date) {
    return res.status(400).json({ error: "Date is required" });
  }

  // Return cached tasks if available for this date
  if (dailyTasksCache[date]) {
    return res.json(dailyTasksCache[date]);
  }

  try {
    const ai = new GoogleGenAI({});
    
    // Generate a seed based on the date string
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
      model: "gemini-3.1-flash-lite-preview",
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
              options: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              correctAnswer: { type: Type.STRING },
              imageUrl: { type: Type.STRING, description: "2-letter ISO country code for flags" },
              mapCoordinates: {
                type: Type.OBJECT,
                properties: {
                  lat: { type: Type.NUMBER },
                  lng: { type: Type.NUMBER }
                }
              }
            },
            required: ["id", "type", "question", "correctAnswer"]
          }
        }
      }
    });

    if (response.text) {
      const tasks = JSON.parse(response.text);
      
      // Process and shuffle options
      const processedTasks = tasks.map((task: any) => {
        if (task.options && task.options.length > 0) {
          const uniqueOptions = Array.from(new Set([...task.options, task.correctAnswer]));
          task.options = uniqueOptions.sort(() => Math.random() - 0.5);
        }
        return task;
      });

      // Cache the tasks for this date so all users get the same ones
      dailyTasksCache[date] = processedTasks;
      return res.json(processedTasks);
    }
    
    res.status(500).json({ error: "Failed to generate tasks" });
  } catch (error: any) {
    console.error("Failed to generate tasks:", error);
    if (error?.message?.includes("API key not valid") || error?.status === 400 || error?.status === 403 || error?.message?.includes("insufficient authentication scopes")) {
      return res.status(401).json({ error: "Invalid or missing Gemini API key. Please check your API key in the AI Studio settings." });
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
      model: "gemini-3.1-flash-lite-preview",
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
              options: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              correctAnswer: { type: Type.STRING },
              imageUrl: { type: Type.STRING, description: "2-letter ISO country code for flags" },
              mapCoordinates: {
                type: Type.OBJECT,
                properties: {
                  lat: { type: Type.NUMBER },
                  lng: { type: Type.NUMBER }
                }
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
    if (error?.message?.includes("API key not valid") || error?.status === 400 || error?.status === 403 || error?.message?.includes("insufficient authentication scopes")) {
      return res.status(401).json({ error: "Invalid or missing Gemini API key. Please check your API key in the AI Studio settings." });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

async function startServer() {
  console.log("GEMINI_API_KEY exists:", !!process.env.GEMINI_API_KEY);
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
