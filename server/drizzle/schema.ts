import { pgTable, uuid, varchar, text, integer, boolean, timestamp, decimal, jsonb, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  avatarUrl: text('avatar_url'),
  level: integer('level').default(1).notNull(),
  title: varchar('title', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// User settings
export const userSettings = pgTable('user_settings', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  notificationsEnabled: boolean('notifications_enabled').default(true).notNull(),
  soundEnabled: boolean('sound_enabled').default(true).notNull(),
  darkMode: boolean('dark_mode').default(false).notNull(),
  language: varchar('language', { length: 10 }).default('en').notNull(),
  units: varchar('units', { length: 20 }).default('metric').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// User stats
export const userStats = pgTable('user_stats', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  currentStreak: integer('current_streak').default(0).notNull(),
  longestStreak: integer('longest_streak').default(0).notNull(),
  totalPoints: integer('total_points').default(0).notNull(),
  daysPlayed: integer('days_played').default(0).notNull(),
  countriesMastered: integer('countries_mastered').default(0).notNull(),
  accuracy: decimal('accuracy', { precision: 5, scale: 2 }).default('0').notNull(),
  totalQuestionsAnswered: integer('total_questions_answered').default(0).notNull(),
  correctAnswers: integer('correct_answers').default(0).notNull(),
  lastPlayedAt: timestamp('last_played_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// User continent mastery
export const userContinentMastery = pgTable('user_continent_mastery', {
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  continent: varchar('continent', { length: 50 }).notNull(),
  masteryPercentage: integer('mastery_percentage').default(0).notNull(),
  questionsAnswered: integer('questions_answered').default(0).notNull(),
  correctAnswers: integer('correct_answers').default(0).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.continent] }),
}));

// Daily challenges (cached Gemini responses)
export const dailyChallenges = pgTable('daily_challenges', {
  id: uuid('id').defaultRandom().primaryKey(),
  date: varchar('date', { length: 10 }).notNull().unique(), // YYYY-MM-DD
  questions: jsonb('questions').notNull(), // Array of question objects
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// User challenge history
export const userChallengeHistory = pgTable('user_challenge_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  challengeDate: varchar('challenge_date', { length: 10 }).notNull(),
  challengeType: varchar('challenge_type', { length: 20 }).default('daily').notNull(),
  score: integer('score').notNull(),
  maxScore: integer('max_score').notNull(),
  timeTakenSeconds: integer('time_taken_seconds'),
  answers: jsonb('answers'), // Detailed answer data
  completedAt: timestamp('completed_at').defaultNow().notNull(),
});

// Achievements
export const achievements = pgTable('achievements', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description').notNull(),
  icon: varchar('icon', { length: 50 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  requirement: integer('requirement').notNull(),
  points: integer('points').default(0).notNull(),
});

// User achievements
export const userAchievements = pgTable('user_achievements', {
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  achievementId: varchar('achievement_id', { length: 50 }).references(() => achievements.id).notNull(),
  unlockedAt: timestamp('unlocked_at').defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.achievementId] }),
}));

// Countries reference data
export const countries = pgTable('countries', {
  code: varchar('code', { length: 3 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  capital: varchar('capital', { length: 100 }),
  region: varchar('region', { length: 50 }).notNull(),
  subregion: varchar('subregion', { length: 50 }),
  population: integer('population'),
  areaKm2: integer('area_km2'),
  languages: jsonb('languages').$type<string[]>(),
  borders: jsonb('borders').$type<string[]>(),
  coordinates: jsonb('coordinates').$type<{ lat: number; lng: number }>(),
  currency: jsonb('currency').$type<{ code: string; name: string; symbol: string }>(),
  flagEmoji: varchar('flag_emoji', { length: 10 }),
  description: text('description'),
  funFacts: jsonb('fun_facts').$type<string[]>(),
});

// User country progress
export const userCountryProgress = pgTable('user_country_progress', {
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  countryCode: varchar('country_code', { length: 3 }).references(() => countries.code).notNull(),
  timesCorrect: integer('times_correct').default(0).notNull(),
  timesIncorrect: integer('times_incorrect').default(0).notNull(),
  mastered: boolean('mastered').default(false).notNull(),
  lastAnsweredAt: timestamp('last_answered_at'),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.countryCode] }),
}));

// Sessions for JWT management
export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  settings: one(userSettings, {
    fields: [users.id],
    references: [userSettings.userId],
  }),
  stats: one(userStats, {
    fields: [users.id],
    references: [userStats.userId],
  }),
  continentMastery: many(userContinentMastery),
  challengeHistory: many(userChallengeHistory),
  achievements: many(userAchievements),
  countryProgress: many(userCountryProgress),
  sessions: many(sessions),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}));

export const userStatsRelations = relations(userStats, ({ one }) => ({
  user: one(users, {
    fields: [userStats.userId],
    references: [users.id],
  }),
}));

export const achievementsRelations = relations(achievements, ({ many }) => ({
  users: many(userAchievements),
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, {
    fields: [userAchievements.userId],
    references: [users.id],
  }),
  achievement: one(achievements, {
    fields: [userAchievements.achievementId],
    references: [achievements.id],
  }),
}));
