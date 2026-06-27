import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useStore } from '../store/useStore';
import { localDateString } from '../lib/utils';
import { Trophy, Home, Flame, MapPin } from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  consumeNewAchievements,
  consumeQuestRecap,
  type UnlockedAchievementDisplay,
  type QuestRecap,
} from '../lib/questSession';
import { motionTransition, staggerContainer, fadeSlideUp, useReducedMotion } from '../lib/motion';

export function QuestCompleted() {
  const navigate = useNavigate();
  const stats = useStore((s) => s.progress.stats);
  const reducedMotion = useReducedMotion();
  const [newAchievements, setNewAchievements] = useState<UnlockedAchievementDisplay[]>([]);
  const [recap, setRecap] = useState<QuestRecap | null>(null);

  useEffect(() => {
    setNewAchievements(consumeNewAchievements());
    setRecap(consumeQuestRecap());

    if (reducedMotion) return;

    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: ReturnType<typeof setInterval> = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults, particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults, particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    return () => clearInterval(interval);
  }, [reducedMotion]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center">
      <div
        className={`w-32 h-32 bg-tertiary-container rounded-full flex items-center justify-center mb-8 shadow-lg ${
          reducedMotion ? '' : 'animate-bounce'
        }`}
      >
        <Trophy className="w-16 h-16 text-on-tertiary-container" />
      </div>
      
      <h1 className="text-4xl font-headline font-bold mb-4 text-primary">Quest Completed!</h1>
      <p className="text-xl text-on-surface-variant mb-8 max-w-md">
        Great job! You've completed today's geography challenge and expanded your knowledge.
      </p>

      {recap && (
        <div className="w-full max-w-md mb-8 bg-surface-container-low p-6 rounded-2xl text-left">
          <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-2">
            Today's score: {recap.score}/{recap.maxScore}
          </p>
          {recap.missedCountries.length > 0 ? (
            <>
              <p className="font-headline font-bold text-on-surface mb-3">Review these in the Atlas:</p>
              <ul className="space-y-2">
                {recap.missedCountries.map((c) => (
                  <li key={`${c.code}-${c.name}`}>
                    <Link
                      to={c.code ? `/atlas?country=${c.code}` : '/atlas'}
                      className="flex items-center gap-2 text-primary font-medium hover:underline"
                    >
                      <MapPin className="w-4 h-4 shrink-0" />
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-on-surface-variant">Perfect score — no countries to review!</p>
          )}
        </div>
      )}

      {newAchievements.length > 0 && (
        <motion.div
          initial="initial"
          animate="animate"
          variants={staggerContainer}
          className="w-full max-w-md mb-8 space-y-3"
        >
          <p className="font-headline font-bold text-on-surface">New achievements unlocked!</p>
          {newAchievements.map((a) => (
            <motion.div
              key={a.id}
              variants={fadeSlideUp}
              transition={motionTransition(reducedMotion, 0.3)}
              className="bg-primary-container/30 border border-primary/20 p-4 rounded-2xl flex items-center gap-4 text-left"
            >
              <span className="material-symbols-outlined text-3xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                {a.icon || 'emoji_events'}
              </span>
              <div>
                <h4 className="font-headline font-bold text-on-surface">{a.name}</h4>
                <p className="text-sm text-on-surface-variant">{a.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-12">
        <div className="bg-surface-container-high p-6 rounded-3xl flex flex-col items-center">
          <Flame className="w-8 h-8 text-tertiary mb-2" />
          <span className="text-3xl font-bold">{stats.currentStreak}</span>
          <span className="text-sm text-on-surface-variant font-medium">Day Streak</span>
        </div>
        <div className="bg-surface-container-high p-6 rounded-3xl flex flex-col items-center">
          <Trophy className="w-8 h-8 text-yellow-500 mb-2" />
          <span className="text-3xl font-bold">{stats.totalPoints}</span>
          <span className="text-sm text-on-surface-variant font-medium">Total Points</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
        <button
          onClick={() => navigate('/')}
          className="flex-1 bg-primary text-on-primary px-6 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-primary-dim transition-colors shadow-md"
        >
          <Home className="w-5 h-5" />
          Dashboard
        </button>
        <button
          onClick={() => {
            const todayStr = localDateString();
            navigate(`/quiz/daily?date=${todayStr}&review=true`);
          }}
          className="flex-1 bg-surface-container-high text-on-surface px-6 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-surface-container-highest transition-colors shadow-sm"
        >
          Review
        </button>
      </div>
    </div>
  );
}
