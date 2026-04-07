import 'dotenv/config';
import { db, users, userSettings, userStats, achievements, countries } from './index';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// ESM compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function seed() {
  console.log('🌱 Starting database seed...');

  // Create dev user with fresh stats (real data, no fake history)
  const devUserPassword = await bcrypt.hash('password123', 10);
  const [devUser] = await db.insert(users).values({
    id: '00000000-0000-0000-0000-000000000001',
    email: 'dev@geodaily.com',
    passwordHash: devUserPassword,
    displayName: 'Dev Explorer',
    level: 1,
    title: 'Beginner',
  }).onConflictDoNothing().returning();

  if (devUser) {
    console.log('✅ Created dev user');

    // Create user settings
    await db.insert(userSettings).values({
      userId: devUser.id,
      notificationsEnabled: true,
      soundEnabled: true,
      darkMode: false,
      language: 'en',
      units: 'metric',
    }).onConflictDoNothing();

    // Create user stats - starting fresh with zeros (real data)
    await db.insert(userStats).values({
      userId: devUser.id,
      currentStreak: 0,
      longestStreak: 0,
      totalPoints: 0,
      daysPlayed: 0,
      countriesMastered: 0,
      accuracy: '0',
      totalQuestionsAnswered: 0,
      correctAnswers: 0,
    }).onConflictDoNothing();

    console.log('✅ Created dev user settings and stats (fresh start)');
  }

  // Seed achievements
  const achievementData = [
    { id: 'first_quest', name: 'First Steps', description: 'Complete your first daily challenge', icon: 'flag', category: 'progress', requirement: 1, points: 50 },
    { id: 'streak_3', name: 'Consistent Explorer', description: 'Maintain a 3-day streak', icon: 'flame', category: 'streak', requirement: 3, points: 100 },
    { id: 'streak_7', name: 'Weekly Warrior', description: 'Maintain a 7-day streak', icon: 'fire', category: 'streak', requirement: 7, points: 250 },
    { id: 'streak_30', name: 'Monthly Master', description: 'Maintain a 30-day streak', icon: 'trophy', category: 'streak', requirement: 30, points: 1000 },
    { id: 'perfect_score', name: 'Perfect Score', description: 'Get 5/5 on a daily challenge', icon: 'star', category: 'accuracy', requirement: 1, points: 150 },
    { id: 'countries_10', name: 'Globe Trotter', description: 'Answer questions about 10 different countries', icon: 'globe', category: 'mastery', requirement: 10, points: 200 },
    { id: 'countries_50', name: 'World Traveler', description: 'Answer questions about 50 different countries', icon: 'plane', category: 'mastery', requirement: 50, points: 500 },
    { id: 'countries_100', name: 'Geography Expert', description: 'Answer questions about 100 different countries', icon: 'crown', category: 'mastery', requirement: 100, points: 1000 },
    { id: 'continent_europe', name: 'European Explorer', description: 'Master all European countries', icon: 'map', category: 'continent', requirement: 1, points: 500 },
    { id: 'continent_asia', name: 'Asian Adventurer', description: 'Master all Asian countries', icon: 'map', category: 'continent', requirement: 1, points: 500 },
    { id: 'continent_africa', name: 'African Adventurer', description: 'Master all African countries', icon: 'map', category: 'continent', requirement: 1, points: 500 },
    { id: 'points_1000', name: 'Rising Star', description: 'Earn 1000 total points', icon: 'sparkle', category: 'points', requirement: 1000, points: 100 },
    { id: 'points_5000', name: 'Shining Beacon', description: 'Earn 5000 total points', icon: 'sun', category: 'points', requirement: 5000, points: 300 },
    { id: 'flags_50', name: 'Flag Expert', description: 'Answer 50 flag questions correctly', icon: 'flag', category: 'skill', requirement: 50, points: 200 },
    { id: 'capitals_50', name: 'Capital Connoisseur', description: 'Answer 50 capital questions correctly', icon: 'building', category: 'skill', requirement: 50, points: 200 },
    { id: 'maps_50', name: 'Map Maven', description: 'Answer 50 map questions correctly', icon: 'map-pin', category: 'skill', requirement: 50, points: 200 },
  ];

  await db.insert(achievements).values(achievementData).onConflictDoNothing();
  console.log(`✅ Seeded ${achievementData.length} achievements`);

  // Seed ALL 195 countries from JSON file
  try {
    const countriesPath = join(__dirname, '../data/countries.json');
    const countriesJson = readFileSync(countriesPath, 'utf-8');
    const countryData = JSON.parse(countriesJson);
    
    // Insert one at a time with better error handling
    let inserted = 0;
    let skipped = 0;
    for (const country of countryData) {
      try {
        await db.insert(countries).values(country).onConflictDoNothing();
        inserted++;
      } catch (err: any) {
        console.warn(`⚠️ Failed to insert ${country.code} (${country.name}):`, err.message);
        skipped++;
      }
    }
    console.log(`✅ Seeded ${inserted} countries (${skipped} skipped)`);
  } catch (error) {
    console.error('❌ Failed to load countries.json:', error);
    // Fallback to minimal country list if JSON not found
    const fallbackCountries = [
      { code: 'FR', name: 'France', region: 'Europe', subregion: 'Western Europe', capital: 'Paris', population: 67390000, areaKm2: 643801, languages: ['French'], flagEmoji: '🇫🇷', borders: ['BE', 'DE', 'IT', 'ES'], coordinates: { lat: 46.2276, lng: 2.2137 }, currency: { code: 'EUR', name: 'Euro', symbol: '€' } },
      { code: 'US', name: 'United States', region: 'North America', subregion: 'Northern America', capital: 'Washington, D.C.', population: 331900000, areaKm2: 9833520, languages: ['English'], flagEmoji: '🇺🇸', borders: ['CA', 'MX'], coordinates: { lat: 37.0902, lng: -95.7129 }, currency: { code: 'USD', name: 'Dollar', symbol: '$' } },
    ];
    await db.insert(countries).values(fallbackCountries).onConflictDoNothing();
    console.log(`⚠️ Seeded ${fallbackCountries.length} fallback countries`);
  }

  console.log('🎉 Database seed completed!');
  process.exit(0);
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
