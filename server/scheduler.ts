import { GoogleGenAI, Type } from '@google/genai';
import { eq } from 'drizzle-orm';
import { db, dailyChallenges } from './drizzle/index';

// Task schema for Gemini
const taskSchema = {
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
};

// Generate date-based seed for deterministic generation
function generateSeed(date: string): number {
  let seed = 0;
  for (let i = 0; i < date.length; i++) {
    seed = (seed << 5) - seed + date.charCodeAt(i);
    seed |= 0;
  }
  return Math.abs(seed);
}

// Process and shuffle options
function processTasks(tasks: any[]): any[] {
  return tasks.map((task: any) => {
    if (task.options && task.options.length > 0) {
      const uniqueOptions = Array.from(new Set([...task.options, task.correctAnswer]));
      task.options = uniqueOptions.sort(() => Math.random() - 0.5);
    }
    return task;
  });
}

// Generate daily challenge for a specific date
export async function generateDailyChallenge(date: string): Promise<boolean> {
  try {
    // Check if already exists
    const existing = await db.select()
      .from(dailyChallenges)
      .where(eq(dailyChallenges.date, date))
      .limit(1);

    if (existing.length > 0) {
      console.log(`[Scheduler] Challenge for ${date} already exists`);
      return true;
    }

    const ai = new GoogleGenAI({});
    const seed = generateSeed(date);

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
        responseSchema: taskSchema
      }
    });

    if (response.text) {
      const tasks = JSON.parse(response.text);
      const processedTasks = processTasks(tasks);

      await db.insert(dailyChallenges)
        .values({ date, questions: processedTasks })
        .onConflictDoNothing();

      console.log(`[Scheduler] ✅ Generated challenge for ${date}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`[Scheduler] ❌ Failed to generate challenge for ${date}:`, error);
    return false;
  }
}

// Generate today's and tomorrow's challenges
export async function ensureDailyChallenges(): Promise<void> {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayStr = today.toISOString().split('T')[0];
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  console.log(`[Scheduler] Ensuring challenges for ${todayStr} and ${tomorrowStr}`);
  
  await generateDailyChallenge(todayStr);
  await generateDailyChallenge(tomorrowStr);
}

// Calculate milliseconds until next midnight UTC
function msUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setUTCHours(24, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}

// Start the daily scheduler
export function startScheduler(): void {
  console.log('[Scheduler] Starting daily challenge scheduler');
  
  // Generate challenges immediately on startup
  ensureDailyChallenges();

  // Schedule next run at midnight UTC
  const scheduleNext = () => {
    const ms = msUntilMidnight();
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    console.log(`[Scheduler] Next generation in ${hours}h ${minutes}m (midnight UTC)`);
    
    setTimeout(() => {
      ensureDailyChallenges();
      scheduleNext(); // Schedule the next day
    }, ms);
  };

  scheduleNext();
}
