const PREFS_KEY = 'geodaily_game_preferences';

export interface GamePreferences {
  soundEnabled: boolean;
  hapticEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
}

const DEFAULT_PREFS: GamePreferences = {
  soundEnabled: true,
  hapticEnabled: true,
  theme: 'system',
};

export function getGamePreferences(): GamePreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function setGamePreferences(prefs: Partial<GamePreferences>): GamePreferences {
  const next = { ...getGamePreferences(), ...prefs };
  localStorage.setItem(PREFS_KEY, JSON.stringify(next));
  applyTheme(next.theme);
  return next;
}

export function applyTheme(theme: GamePreferences['theme']): void {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
  document.documentElement.classList.toggle('dark', isDark);
}

export function playCorrectSound(): void {
  if (!getGamePreferences().soundEnabled) return;
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 523;
    gain.gain.value = 0.08;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.stop(ctx.currentTime + 0.2);
  } catch {
    // Audio not available
  }
}

export function triggerHaptic(): void {
  if (!getGamePreferences().hapticEnabled) return;
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(40);
  }
}
