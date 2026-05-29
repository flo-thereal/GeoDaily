/**
 * Pre-generates daily-challenge JSON files committed into the repo and served as
 * static data on GitHub Pages. Run by .github/workflows/generate-challenges.yml.
 *
 *   GEMINI_API_KEY=... npm run generate:challenges
 *
 * Without a key (or on any Gemini error) it falls back to the same deterministic
 * client generator used in the browser, so the app always has data.
 */
import { mkdirSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { generateDailyTasks, generateSeed } from '../src/lib/generateQuiz';

const OUT_DIR = join(process.cwd(), 'public', 'data', 'challenges');
const DAYS = Number(process.env.CHALLENGE_DAYS ?? 14);

const taskSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      type: { type: Type.STRING, enum: ['flag', 'capital', 'map'] },
      question: { type: Type.STRING },
      options: { type: Type.ARRAY, items: { type: Type.STRING } },
      correctAnswer: { type: Type.STRING },
      imageUrl: { type: Type.STRING, description: '2-letter ISO country code for flags' },
      mapCoordinates: {
        type: Type.OBJECT,
        properties: { lat: { type: Type.NUMBER }, lng: { type: Type.NUMBER } },
      },
    },
    required: ['id', 'type', 'question', 'correctAnswer'],
  },
};

const PROMPT = (date: string) => `Generate 5 geography quiz questions for a daily challenge for the date ${date}.
Mix the types: 'flag' (guess country from flag), 'capital' (guess capital of country), 'map' (guess country from description/location).
For 'flag' type, provide the country name in 'correctAnswer' and 3 other country names in 'options'. The 'question' should be "Which country's flag is this?". Provide the 2-letter ISO country code in 'imageUrl' so I can fetch the flag.
For 'capital' type, provide the country name in 'question' (e.g., "What is the capital of France?"), the capital in 'correctAnswer', and 3 other cities in 'options'.
For 'map' type, provide a description of a specific city, landmark, or country in 'question' (e.g., "Where is the Eiffel Tower located?"). Provide the exact lat/lng in 'mapCoordinates'. 'correctAnswer' is the name of the place. 'options' can be empty.
Make the questions interesting and varied.`;

function processTasks(tasks: any[]): any[] {
  return tasks.map((task) => {
    if (task.options && task.options.length > 0) {
      const unique = Array.from(new Set([...task.options, task.correctAnswer]));
      task.options = unique.sort(() => Math.random() - 0.5);
    }
    return task;
  });
}

async function generateWithGemini(ai: GoogleGenAI, date: string): Promise<any[]> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: PROMPT(date),
    config: {
      seed: generateSeed(date),
      responseMimeType: 'application/json',
      responseSchema: taskSchema,
    },
  });
  if (!response.text) throw new Error('Empty Gemini response');
  return processTasks(JSON.parse(response.text));
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const apiKey = process.env.GEMINI_API_KEY;
  const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
  if (!ai) {
    console.warn('⚠️  GEMINI_API_KEY not set — using deterministic local generator.');
  }

  const today = new Date();
  let written = 0;

  for (let i = 0; i < DAYS; i++) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() + i);
    const date = d.toISOString().split('T')[0];
    const file = join(OUT_DIR, `${date}.json`);
    if (existsSync(file)) continue;

    let tasks: any[];
    try {
      tasks = ai ? await generateWithGemini(ai, date) : generateDailyTasks(date);
    } catch (err) {
      console.warn(`⚠️  Gemini failed for ${date} (${(err as Error).message}); using local fallback.`);
      tasks = generateDailyTasks(date);
    }

    writeFileSync(file, JSON.stringify(tasks, null, 2) + '\n');
    console.log(`✅ ${date} → ${file}`);
    written++;
  }

  console.log(`Done. ${written} new challenge file(s) written to ${OUT_DIR}.`);
}

main().catch((err) => {
  console.error('❌ Challenge generation failed:', err);
  process.exit(1);
});
