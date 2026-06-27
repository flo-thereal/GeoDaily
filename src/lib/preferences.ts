import type { Settings } from '../store/useStore';
import { defaultSettings } from '../store/useStore';

const STORAGE_KEY = 'geodaily-storage';

export interface GamePreferences {
  soundEnabled: boolean;
  hapticEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
}

function readPersistedSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultSettings };
    const parsed = JSON.parse(raw) as { state?: { settings?: Partial<Settings> } };
    return { ...defaultSettings, ...parsed?.state?.settings };
  } catch {
    return { ...defaultSettings };
  }
}

export function getGamePreferences(): GamePreferences {
  const settings = readPersistedSettings();
  const theme =
    settings.theme === 'dark' || settings.theme === 'light' ? settings.theme : 'system';
  return {
    soundEnabled: settings.soundEnabled,
    hapticEnabled: settings.hapticEnabled,
    theme,
  };
}

export function setGamePreferences(prefs: Partial<GamePreferences>): GamePreferences {
  const next = { ...getGamePreferences(), ...prefs };
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

export function playWrongSound(): void {
  if (!getGamePreferences().soundEnabled) return;
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 220;
    gain.gain.value = 0.06;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.stop(ctx.currentTime + 0.12);
  } catch {
    // Audio not available
  }
}

export function triggerWrongHaptic(): void {
  if (!getGamePreferences().hapticEnabled) return;
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate([30, 50, 30]);
  }
}
