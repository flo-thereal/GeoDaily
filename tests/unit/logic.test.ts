import { describe, it, expect } from 'vitest';

// Test date utility functions that might be used throughout the app
describe('Date Utilities', () => {
  it('should format date as YYYY-MM-DD', () => {
    const date = new Date('2026-04-07T12:00:00Z');
    const formatted = date.toISOString().split('T')[0];
    expect(formatted).toBe('2026-04-07');
  });

  it('should get yesterday date correctly', () => {
    const today = new Date('2026-04-07');
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    expect(yesterday.toISOString().split('T')[0]).toBe('2026-04-06');
  });

  it('should handle month boundaries', () => {
    const firstOfMonth = new Date('2026-04-01');
    const yesterday = new Date(firstOfMonth);
    yesterday.setDate(yesterday.getDate() - 1);
    
    expect(yesterday.toISOString().split('T')[0]).toBe('2026-03-31');
  });

  it('should handle year boundaries', () => {
    const firstOfYear = new Date('2026-01-01');
    const yesterday = new Date(firstOfYear);
    yesterday.setDate(yesterday.getDate() - 1);
    
    expect(yesterday.toISOString().split('T')[0]).toBe('2025-12-31');
  });
});

// Test score calculations
describe('Score Calculations', () => {
  it('should calculate score from correct answers', () => {
    const correctAnswers = 4;
    const totalQuestions = 5;
    const pointsPerQuestion = 100;
    
    const score = correctAnswers * pointsPerQuestion;
    expect(score).toBe(400);
  });

  it('should calculate accuracy percentage', () => {
    const correct = 3;
    const total = 5;
    const accuracy = Math.round((correct / total) * 100);
    
    expect(accuracy).toBe(60);
  });

  it('should handle perfect score', () => {
    const correct = 5;
    const total = 5;
    const accuracy = Math.round((correct / total) * 100);
    
    expect(accuracy).toBe(100);
  });

  it('should handle zero correct', () => {
    const correct = 0;
    const total = 5;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    
    expect(accuracy).toBe(0);
  });
});

// Test streak logic
describe('Streak Calculations', () => {
  it('should increment streak for consecutive days', () => {
    const today = '2026-04-07';
    const lastPlayed = '2026-04-06';
    const currentStreak = 5;
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    let newStreak = 1;
    if (lastPlayed === yesterdayStr) {
      newStreak = currentStreak + 1;
    }
    
    expect(newStreak).toBe(6);
  });

  it('should reset streak for non-consecutive days', () => {
    const today = '2026-04-07';
    const lastPlayed = '2026-04-04'; // 3 days ago
    const currentStreak = 5;
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    let newStreak = 1;
    if (lastPlayed === yesterdayStr) {
      newStreak = currentStreak + 1;
    }
    
    expect(newStreak).toBe(1); // Reset to 1
  });

  it('should maintain streak for same day', () => {
    const today = '2026-04-07';
    const lastPlayed = '2026-04-07'; // Same day
    const currentStreak = 5;
    
    let newStreak = 1;
    if (lastPlayed === today) {
      newStreak = currentStreak; // Keep same
    }
    
    expect(newStreak).toBe(5);
  });

  it('should track longest streak', () => {
    const currentStreak = 10;
    const longestStreak = 7;
    
    const newLongestStreak = Math.max(currentStreak, longestStreak);
    
    expect(newLongestStreak).toBe(10);
  });
});

// Test achievement unlock conditions
describe('Achievement Conditions', () => {
  it('should unlock first_quest after first completion', () => {
    const daysPlayed = 1;
    const shouldUnlock = daysPlayed >= 1;
    
    expect(shouldUnlock).toBe(true);
  });

  it('should not unlock first_quest before completion', () => {
    const daysPlayed = 0;
    const shouldUnlock = daysPlayed >= 1;
    
    expect(shouldUnlock).toBe(false);
  });

  it('should unlock streak_3 at 3 day streak', () => {
    const streak = 3;
    const shouldUnlock = streak >= 3;
    
    expect(shouldUnlock).toBe(true);
  });

  it('should unlock perfect_score at 500 points max', () => {
    const score = 500;
    const maxScore = 500;
    const isPerfect = score === maxScore && maxScore >= 500;
    
    expect(isPerfect).toBe(true);
  });

  it('should not unlock perfect_score at 400/500', () => {
    const score = 400;
    const maxScore = 500;
    const isPerfect = score === maxScore && maxScore >= 500;
    
    expect(isPerfect).toBe(false);
  });

  it('should unlock points_1000 at threshold', () => {
    const totalPoints = 1000;
    const shouldUnlock = totalPoints >= 1000;
    
    expect(shouldUnlock).toBe(true);
  });

  it('should unlock countries_10 at 10 mastered', () => {
    const countriesMastered = 10;
    const shouldUnlock = countriesMastered >= 10;
    
    expect(shouldUnlock).toBe(true);
  });
});

// Test country mastery logic
describe('Country Mastery', () => {
  it('should master country after 3 correct answers', () => {
    const timesCorrect = 3;
    const shouldBeMastered = timesCorrect >= 3;
    
    expect(shouldBeMastered).toBe(true);
  });

  it('should not master with 2 correct answers', () => {
    const timesCorrect = 2;
    const shouldBeMastered = timesCorrect >= 3;
    
    expect(shouldBeMastered).toBe(false);
  });

  it('should count newly mastered countries', () => {
    const existingMastered = false;
    const newMastered = true;
    
    const isNewlyMastered = newMastered && !existingMastered;
    
    expect(isNewlyMastered).toBe(true);
  });
});

// Test question type distribution
describe('Question Types', () => {
  it('should recognize valid question types', () => {
    const validTypes = ['flag', 'capital', 'map'];
    
    expect(validTypes).toContain('flag');
    expect(validTypes).toContain('capital');
    expect(validTypes).toContain('map');
  });

  it('should track stats per question type', () => {
    const typeStats: Record<string, { correct: number; total: number }> = {
      flag: { correct: 0, total: 0 },
      capital: { correct: 0, total: 0 },
      map: { correct: 0, total: 0 },
    };
    
    // Simulate answering a flag question correctly
    typeStats.flag.total++;
    typeStats.flag.correct++;
    
    expect(typeStats.flag.correct).toBe(1);
    expect(typeStats.flag.total).toBe(1);
  });
});
