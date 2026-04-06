import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Trophy, Home, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';

export function QuestCompleted() {
  const navigate = useNavigate();
  const { streak, points } = useStore();

  useEffect(() => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
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
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center">
      <div className="w-32 h-32 bg-tertiary-container rounded-full flex items-center justify-center mb-8 shadow-lg animate-bounce">
        <Trophy className="w-16 h-16 text-on-tertiary-container" />
      </div>
      
      <h1 className="text-4xl font-headline font-bold mb-4 text-primary">Quest Completed!</h1>
      <p className="text-xl text-on-surface-variant mb-8 max-w-md">
        Great job! You've completed today's geography challenge and expanded your knowledge.
      </p>

      <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-12">
        <div className="bg-surface-container-high p-6 rounded-3xl flex flex-col items-center">
          <Flame className="w-8 h-8 text-tertiary mb-2" />
          <span className="text-3xl font-bold">{streak}</span>
          <span className="text-sm text-on-surface-variant font-medium">Day Streak</span>
        </div>
        <div className="bg-surface-container-high p-6 rounded-3xl flex flex-col items-center">
          <Trophy className="w-8 h-8 text-yellow-500 mb-2" />
          <span className="text-3xl font-bold">{points}</span>
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
            const todayStr = new Date().toISOString().split('T')[0];
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
