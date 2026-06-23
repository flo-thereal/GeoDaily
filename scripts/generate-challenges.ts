/**
 * Pre-generates daily-challenge JSON files committed into the repo and served as
 * static data on GitHub Pages. Run by .github/workflows/generate-challenges.yml.
 *
 *   GEMINI_API_KEY=... npm run generate:challenges
 *
 * Without a key (or on any Gemini error) it falls back to the same deterministic
 * client generator used in the browser, so the app always has data.
 */
import { mkdirSync, existsSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import {
  challengeHasCountryConflicts,
  generateDailyTasks,
  generateSeed,
} from '../src/lib/generateQuiz';
import {
  CHALLENGE_LOOKBACK_DAYS,
  collectExcludedCountryCodes,
} from '../src/lib/challengeHistory';
import { normalizeChallengeTask } from '../src/lib/taskNormalization';
import type { DailyTask } from '../src/store/useStore';

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
      imageUrl: { type: Type.STRING, description: '2-letter ISO country code (required for flag, capital, and map tasks)' },
      countryCode: { type: Type.STRING, description: '2-letter ISO country code (required for capital and map tasks)' },
      mapCoordinates: {
        type: Type.OBJECT,
        properties: { lat: { type: Type.NUMBER }, lng: { type: Type.NUMBER } },
      },
    },
    required: ['id', 'type', 'question', 'correctAnswer'],
  },
};

const PROMPT = (date: string, excludedCodes: string[]) => {
  const exclusion =
    excludedCodes.length > 0
      ? `Do NOT use these countries (already used in the last ${CHALLENGE_LOOKBACK_DAYS} days): ${excludedCodes.join(', ')}.`
      : '';
  return `Generate 10 geography quiz questions for a daily challenge for the date ${date}.
Use a map-heavy mix: 4 'map', 3 'flag', and 3 'capital' questions.
For 'flag' type, provide the country name in 'correctAnswer' and 3 other country names in 'options'. The 'question' should be "Which country's flag is this?". Provide the 2-letter ISO country code in 'imageUrl' so I can fetch the flag.
For 'capital' type, provide the question "Where is the capital of {country}?", the capital city name in 'correctAnswer', empty 'options', exact capital lat/lng in 'mapCoordinates', and the 2-letter ISO country code in both 'imageUrl' and 'countryCode'.
For 'map' type, provide a location question, the place or country name in 'correctAnswer', empty 'options', exact lat/lng in 'mapCoordinates', and the host country's 2-letter ISO code in both 'imageUrl' and 'countryCode' (required even for landmark questions like Machu Picchu — use the country code, e.g. PE for Peru).
Make the questions interesting and varied. Use 10 different countries with no repeats within the challenge. ${exclusion}
Always include imageUrl and countryCode on capital and map tasks.`;
};

function loadExcludedFromFiles(date: string): Set<string> {
  return collectExcludedCountryCodes(date, CHALLENGE_LOOKBACK_DAYS, (priorDate) => {
    const file = join(OUT_DIR, `${priorDate}.json`);
    if (!existsSync(file)) return undefined;
    return JSON.parse(readFileSync(file, 'utf8')) as DailyTask[];
  });
}

function processTasks(tasks: DailyTask[]): DailyTask[] {
  return tasks.map((task) => {
    let next = { ...task };
    if (next.options && next.options.length > 0) {
      const unique = Array.from(new Set([...next.options, next.correctAnswer]));
      next.options = unique.sort(() => Math.random() - 0.5);
    }
    return normalizeChallengeTask(next);
  });
}

async function generateWithGemini(
  ai: GoogleGenAI,
  date: string,
  excludedCodes: Set<string>
): Promise<DailyTask[]> {
  const excludedList = [...excludedCodes].sort();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: PROMPT(date, excludedList),
    config: {
      seed: generateSeed(date),
      responseMimeType: 'application/json',
      responseSchema: taskSchema,
    },
  });
  if (!response.text) throw new Error('Empty Gemini response');
  return processTasks(JSON.parse(response.text));
}

async function generateTasksForDate(
  ai: GoogleGenAI | null,
  date: string,
  excludedCodes: Set<string>
): Promise<DailyTask[]> {
  if (!ai) return generateDailyTasks(date, excludedCodes);

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const tasks = await generateWithGemini(ai, date, excludedCodes);
      if (!challengeHasCountryConflicts(tasks, excludedCodes)) return tasks;
      console.warn(`⚠️  Gemini reused recent countries for ${date}; retrying (${attempt + 1}/2).`);
    } catch (err) {
      console.warn(`⚠️  Gemini failed for ${date} (${(err as Error).message}); using local fallback.`);
      break;
    }
  }

  return generateDailyTasks(date, excludedCodes);
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

    const excludedCodes = loadExcludedFromFiles(date);

    let tasks: DailyTask[];
    try {
      tasks = await generateTasksForDate(ai, date, excludedCodes);
    } catch (err) {
      console.warn(`⚠️  Generation failed for ${date} (${(err as Error).message}); using local fallback.`);
      tasks = generateDailyTasks(date, excludedCodes);
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
