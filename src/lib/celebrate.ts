import confetti from 'canvas-confetti';
import { playCorrectSound, playWrongSound, triggerHaptic, triggerWrongHaptic } from './preferences';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function celebrateAnswer(pointsEarned: number, isCorrect: boolean): void {
  if (isCorrect && pointsEarned > 0) {
    playCorrectSound();
    triggerHaptic();
    if (!prefersReducedMotion()) {
      confetti({
        particleCount: pointsEarned >= 100 ? 100 : 30,
        spread: pointsEarned >= 100 ? 70 : 50,
        origin: { y: 0.6 },
        colors: ['#176a21', '#9df197', '#ff9727'],
      });
    }
  } else if (!isCorrect) {
    playWrongSound();
    triggerWrongHaptic();
  }
}
