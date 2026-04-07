import { Router, Response } from 'express';
import { eq, desc, gte, sql } from 'drizzle-orm';
import { AuthRequest, authMiddleware, generateToken, comparePassword, createUser, getUserByEmail } from '../auth';
import { db, users, userSettings, userStats, userContinentMastery, userAchievements, achievements, userChallengeHistory } from '../drizzle/index';

const router = Router();

// Register new user
router.post('/register', async (req: AuthRequest, res: Response) => {
  const { email, password, displayName } = req.body;

  if (!email || !password || !displayName) {
    return res.status(400).json({ error: 'Email, password, and display name are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    // Check if user exists
    const existing = await getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const user = await createUser(email, password, displayName);
    const token = generateToken(user);

    res.status(201).json({
      user,
      token,
    });
  } catch (error) {
    console.error('Failed to register user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const result = await getUserByEmail(email);
    if (!result || !result.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await comparePassword(password, result.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(result.user);

    res.json({
      user: result.user,
      token,
    });
  } catch (error) {
    console.error('Failed to login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  try {
    // Get user
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get stats
    const [stats] = await db.select().from(userStats).where(eq(userStats.userId, userId));

    // Get continent mastery
    const continents = await db.select()
      .from(userContinentMastery)
      .where(eq(userContinentMastery.userId, userId));

    // Get recent achievements
    const userAchievementsList = await db.select({
      id: achievements.id,
      name: achievements.name,
      description: achievements.description,
      icon: achievements.icon,
      category: achievements.category,
      unlockedAt: userAchievements.unlockedAt,
    })
    .from(userAchievements)
    .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
    .where(eq(userAchievements.userId, userId))
    .limit(10);

    res.json({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      level: user.level,
      title: user.title,
      createdAt: user.createdAt,
      stats: stats ? {
        totalPoints: stats.totalPoints,
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
        daysPlayed: stats.daysPlayed,
        totalQuestionsAnswered: stats.totalQuestionsAnswered,
        correctAnswers: stats.correctAnswers,
        countriesMastered: stats.countriesMastered,
        accuracy: stats.totalQuestionsAnswered > 0 
          ? Math.round((stats.correctAnswers / stats.totalQuestionsAnswered) * 100) 
          : 0,
      } : {
        totalPoints: 0,
        currentStreak: 0,
        longestStreak: 0,
        daysPlayed: 0,
        totalQuestionsAnswered: 0,
        correctAnswers: 0,
        countriesMastered: 0,
        accuracy: 0,
      },
      continentMastery: continents.reduce((acc: Record<string, number>, c) => {
        acc[c.continent] = c.masteryPercentage;
        return acc;
      }, {}),
      achievements: userAchievementsList,
    });
  } catch (error) {
    console.error('Failed to get user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.patch('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { displayName, avatarUrl, title } = req.body;

  try {
    const updateData: Partial<typeof users.$inferInsert> = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (title !== undefined) updateData.title = title;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    await db.update(users).set(updateData).where(eq(users.id, userId));

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to update profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user settings
router.get('/settings', authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  try {
    const [settings] = await db.select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId));

    if (!settings) {
      return res.status(404).json({ error: 'Settings not found' });
    }

    res.json({
      notificationsEnabled: settings.notificationsEnabled,
      soundEnabled: settings.soundEnabled,
      darkMode: settings.darkMode,
      language: settings.language,
      units: settings.units,
    });
  } catch (error) {
    console.error('Failed to get settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user settings
router.patch('/settings', authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { notificationsEnabled, soundEnabled, darkMode, language, units } = req.body;

  try {
    const updateData: Partial<typeof userSettings.$inferInsert> = {};
    if (notificationsEnabled !== undefined) updateData.notificationsEnabled = notificationsEnabled;
    if (soundEnabled !== undefined) updateData.soundEnabled = soundEnabled;
    if (darkMode !== undefined) updateData.darkMode = darkMode;
    if (language !== undefined) updateData.language = language;
    if (units !== undefined) updateData.units = units;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    await db.update(userSettings).set(updateData).where(eq(userSettings.userId, userId));

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to update settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get learning history (scores over time)
router.get('/history', authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const days = parseInt(req.query.days as string) || 30;

  try {
    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    // Get challenge history for the period
    const history = await db.select({
      date: userChallengeHistory.challengeDate,
      score: userChallengeHistory.score,
      maxScore: userChallengeHistory.maxScore,
    })
    .from(userChallengeHistory)
    .where(eq(userChallengeHistory.userId, userId))
    .orderBy(desc(userChallengeHistory.challengeDate))
    .limit(days);

    // Build daily breakdown - group scores by date
    const dailyScores: Record<string, { score: number; maxScore: number }> = {};
    for (const entry of history) {
      const date = entry.date;
      if (!dailyScores[date]) {
        dailyScores[date] = { score: 0, maxScore: 0 };
      }
      dailyScores[date].score += entry.score;
      dailyScores[date].maxScore += entry.maxScore;
    }

    // Fill in all days with zeros for days without activity
    const result: { date: string; score: number; maxScore: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        score: dailyScores[dateStr]?.score || 0,
        maxScore: dailyScores[dateStr]?.maxScore || 0,
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Failed to get learning history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
