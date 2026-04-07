import { Router, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import { eq, desc, and, sql } from 'drizzle-orm';
import { AuthRequest, authMiddleware } from '../auth';
import { 
  db, 
  dailyChallenges, 
  userChallengeHistory, 
  userStats, 
  userContinentMastery, 
  userCountryProgress,
  userAchievements,
  achievements,
  countries 
} from '../drizzle/index';

const router = Router();

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

// Generate date-based seed
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

// Get daily challenge
router.get('/daily', async (req: AuthRequest, res: Response) => {
  const date = req.query.date as string;
  if (!date) {
    return res.status(400).json({ error: "Date is required" });
  }

  try {
    // Check if we have cached tasks in the database
    const cached = await db.select()
      .from(dailyChallenges)
      .where(eq(dailyChallenges.date, date))
      .limit(1);

    if (cached.length > 0) {
      return res.json(cached[0].questions);
    }

    // Generate new tasks
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

      // Cache in database
      await db.insert(dailyChallenges)
        .values({ date, questions: processedTasks })
        .onConflictDoNothing();

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

// Get practice questions
router.get('/practice', async (req: AuthRequest, res: Response) => {
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
        responseSchema: taskSchema
      }
    });

    if (response.text) {
      const tasks = JSON.parse(response.text);
      return res.json(processTasks(tasks));
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

// Submit challenge results (requires auth)
router.post('/submit', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { date, score, maxScore, timeTaken, answers, tasks } = req.body;
  const userId = req.user!.id;

  if (!date || score === undefined || maxScore === undefined) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Save challenge history
    await db.insert(userChallengeHistory)
      .values({
        userId,
        challengeDate: date,
        challengeType: 'daily',
        score,
        maxScore,
        timeTakenSeconds: timeTaken || null,
        answers: answers || null,
      });

    // Update user stats
    const [currentStats] = await db.select()
      .from(userStats)
      .where(eq(userStats.userId, userId));

    if (!currentStats) {
      return res.status(500).json({ error: "User stats not found" });
    }

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const lastPlayed = currentStats.lastPlayedAt?.toISOString().split('T')[0];
    let newStreak = 1;
    if (lastPlayed === yesterdayStr) {
      newStreak = currentStats.currentStreak + 1;
    } else if (lastPlayed === today) {
      newStreak = currentStats.currentStreak;
    }

    const longestStreak = Math.max(newStreak, currentStats.longestStreak);
    const newTotalPoints = currentStats.totalPoints + score;
    const newDaysPlayed = currentStats.daysPlayed + (lastPlayed !== today ? 1 : 0);
    const isPerfectScore = score === maxScore && maxScore >= 500; // 5/5 correct

    await db.update(userStats)
      .set({
        totalPoints: newTotalPoints,
        currentStreak: newStreak,
        longestStreak,
        lastPlayedAt: new Date(),
        daysPlayed: newDaysPlayed,
        totalQuestionsAnswered: currentStats.totalQuestionsAnswered + (maxScore / 100),
        correctAnswers: currentStats.correctAnswers + (score / 100),
      })
      .where(eq(userStats.userId, userId));

    // Process answers for country/continent tracking if tasks provided
    if (tasks && answers && Array.isArray(tasks) && Array.isArray(answers)) {
      // Track by question type (flags, capitals, maps)
      const typeStats: Record<string, { correct: number; total: number }> = {
        flag: { correct: 0, total: 0 },
        capital: { correct: 0, total: 0 },
        map: { correct: 0, total: 0 },
      };
      
      // Track by country and continent
      const countryAnswers: Record<string, { correct: number; total: number }> = {};
      const continentAnswers: Record<string, { correct: number; total: number }> = {};

      for (let i = 0; i < tasks.length && i < answers.length; i++) {
        const task = tasks[i];
        const answer = answers[i];
        const isCorrect = answer?.isCorrect === true;
        
        // Track by question type
        const qType = task.type?.toLowerCase() || 'map';
        if (typeStats[qType]) {
          typeStats[qType].total++;
          if (isCorrect) typeStats[qType].correct++;
        }

        // Extract country code from imageUrl (flags use 2-letter codes)
        // or try to look up from the question text
        let countryCode: string | null = task.imageUrl?.toUpperCase() || null;
        if (countryCode && countryCode.length === 2) {
          // Convert 2-letter to 3-letter if needed (we store 3-letter in DB)
          // For now, just track what we have
        }

        // Look up country to get region/continent
        if (countryCode) {
          if (!countryAnswers[countryCode]) {
            countryAnswers[countryCode] = { correct: 0, total: 0 };
          }
          countryAnswers[countryCode].total++;
          if (isCorrect) countryAnswers[countryCode].correct++;
        }
      }

      // Update country progress - first validate which country codes exist
      let newCountriesMastered = currentStats.countriesMastered;
      const validCountries = await db.select({ code: countries.code })
        .from(countries);
      const validCountryCodes = new Set(validCountries.map(c => c.code));

      for (const [code, stats] of Object.entries(countryAnswers)) {
        // Skip invalid country codes (2-letter codes that don't match our 3-letter codes)
        if (!validCountryCodes.has(code)) {
          continue;
        }

        // Get or create country progress
        const [existing] = await db.select()
          .from(userCountryProgress)
          .where(and(
            eq(userCountryProgress.userId, userId),
            eq(userCountryProgress.countryCode, code)
          ));

        if (existing) {
          const newCorrect = existing.timesCorrect + stats.correct;
          const newIncorrect = existing.timesIncorrect + (stats.total - stats.correct);
          const shouldBeMastered = newCorrect >= 3; // 3 correct answers = mastered
          
          await db.update(userCountryProgress)
            .set({
              timesCorrect: newCorrect,
              timesIncorrect: newIncorrect,
              mastered: shouldBeMastered,
              lastAnsweredAt: new Date(),
            })
            .where(and(
              eq(userCountryProgress.userId, userId),
              eq(userCountryProgress.countryCode, code)
            ));
          
          // Count newly mastered countries
          if (shouldBeMastered && !existing.mastered) {
            newCountriesMastered++;
          }
        } else {
          const shouldBeMastered = stats.correct >= 3;
          await db.insert(userCountryProgress)
            .values({
              userId,
              countryCode: code,
              timesCorrect: stats.correct,
              timesIncorrect: stats.total - stats.correct,
              mastered: shouldBeMastered,
              lastAnsweredAt: new Date(),
            })
            .onConflictDoNothing();
          
          if (shouldBeMastered) {
            newCountriesMastered++;
          }
        }
      }

      // Update countries mastered if changed
      if (newCountriesMastered !== currentStats.countriesMastered) {
        await db.update(userStats)
          .set({ countriesMastered: newCountriesMastered })
          .where(eq(userStats.userId, userId));
      }
    }

    // Check and unlock achievements
    const unlockedAchievements: string[] = [];
    
    // Get user's already unlocked achievements
    const existingUnlocks = await db.select({ achievementId: userAchievements.achievementId })
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId));
    const alreadyUnlocked = new Set(existingUnlocks.map(a => a.achievementId));

    // Get all achievements to check
    const allAchievements = await db.select().from(achievements);

    for (const ach of allAchievements) {
      if (alreadyUnlocked.has(ach.id)) continue;

      let shouldUnlock = false;

      switch (ach.id) {
        case 'first_quest':
          shouldUnlock = newDaysPlayed >= 1;
          break;
        case 'streak_3':
          shouldUnlock = newStreak >= 3;
          break;
        case 'streak_7':
          shouldUnlock = newStreak >= 7;
          break;
        case 'streak_30':
          shouldUnlock = newStreak >= 30;
          break;
        case 'perfect_score':
          shouldUnlock = isPerfectScore;
          break;
        case 'points_1000':
          shouldUnlock = newTotalPoints >= 1000;
          break;
        case 'points_5000':
          shouldUnlock = newTotalPoints >= 5000;
          break;
        // Country mastery achievements
        case 'countries_10':
          shouldUnlock = currentStats.countriesMastered >= 10;
          break;
        case 'countries_50':
          shouldUnlock = currentStats.countriesMastered >= 50;
          break;
        case 'countries_100':
          shouldUnlock = currentStats.countriesMastered >= 100;
          break;
      }

      if (shouldUnlock) {
        await db.insert(userAchievements)
          .values({ userId, achievementId: ach.id })
          .onConflictDoNothing();
        unlockedAchievements.push(ach.id);
      }
    }

    res.json({ 
      success: true, 
      newAchievements: unlockedAchievements.length > 0 ? unlockedAchievements : undefined 
    });
  } catch (error) {
    console.error("Failed to submit challenge:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get user's challenge history
router.get('/history', authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const limit = parseInt(req.query.limit as string) || 30;

  try {
    const history = await db.select()
      .from(userChallengeHistory)
      .where(eq(userChallengeHistory.userId, userId))
      .orderBy(desc(userChallengeHistory.completedAt))
      .limit(limit);

    // Transform to expected format
    const formattedHistory: Record<string, any> = {};
    for (const row of history) {
      formattedHistory[row.challengeDate] = {
        date: row.challengeDate,
        score: row.score,
        maxScore: row.maxScore,
        timeTaken: row.timeTakenSeconds,
        answers: row.answers,
        completedAt: row.completedAt,
      };
    }

    res.json(formattedHistory);
  } catch (error) {
    console.error("Failed to get history:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
