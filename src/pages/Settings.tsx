import { useState, useEffect, useCallback } from 'react';
import { getUserSettings, updateSettings, UserSettings } from '../services/api';
import { setGamePreferences } from '../lib/preferences';
import { syncDailyReminder } from '../lib/reminders';
import { useStore } from '../store/useStore';

interface SettingsState {
  language: string;
  dailyReminderEnabled: boolean;
  dailyReminderTime: string;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  theme: string;
}

function convertApiSettingsToState(apiSettings: UserSettings): SettingsState {
  return {
    language: apiSettings.language,
    dailyReminderEnabled: apiSettings.daily_reminder_enabled,
    dailyReminderTime: apiSettings.daily_reminder_time?.slice(0, 5) || '09:00',
    soundEnabled: apiSettings.sound_enabled,
    hapticEnabled: apiSettings.haptic_enabled,
    theme: apiSettings.theme,
  };
}

function Toggle({ enabled, onToggle, disabled }: { enabled: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-primary' : 'bg-outline-variant'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export function Settings() {
  const [settings, setSettings] = useState<SettingsState | null>(null);
  const [originalSettings, setOriginalSettings] = useState<SettingsState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const apiSettings = await getUserSettings();
      const stateSettings = convertApiSettingsToState(apiSettings);
      setSettings(stateSettings);
      setOriginalSettings(stateSettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    if (!settings) return;

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await updateSettings({
        language: settings.language,
        dailyReminderEnabled: settings.dailyReminderEnabled,
        dailyReminderTime: settings.dailyReminderTime,
        soundEnabled: settings.soundEnabled,
        hapticEnabled: settings.hapticEnabled,
        theme: settings.theme,
      });
      const theme = (settings.theme === 'dark' || settings.theme === 'light'
        ? settings.theme
        : 'system') as 'light' | 'dark' | 'system';
      setGamePreferences({
        soundEnabled: settings.soundEnabled,
        hapticEnabled: settings.hapticEnabled,
        theme,
      });
      await syncDailyReminder(settings.dailyReminderEnabled, settings.dailyReminderTime);
      setOriginalSettings(settings);
      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (originalSettings) {
      setSettings(originalSettings);
    }
  };

  const handleExportProgress = () => {
    const { history, progress } = useStore.getState();
    const payload = JSON.stringify({ history, progress }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `geodaily-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetProgress = () => {
    if (
      window.confirm(
        'Reset all progress on this device? Streaks, points, achievements, and challenge history will be deleted. This cannot be undone.'
      )
    ) {
      useStore.getState().resetAllProgress();
      setSuccessMessage('Progress reset. Your preferences were kept.');
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  const updateSetting =<K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings(prev => prev ? { ...prev, [key]: value } : null);
  };

  const handleInstantGamePreference = async (
    key: 'soundEnabled' | 'hapticEnabled',
    value: boolean
  ) => {
    updateSetting(key, value);
    try {
      await updateSettings({ [key]: value });
      setGamePreferences({ [key]: value });
      setOriginalSettings((prev) => (prev ? { ...prev, [key]: value } : null));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preference');
    }
  };

  const hasChanges = settings && originalSettings && 
    JSON.stringify(settings) !== JSON.stringify(originalSettings);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-on-surface-variant">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-12 max-w-5xl mx-auto w-full space-y-12">
        {/* Error/Success Messages */}
        {error && (
          <div className="bg-error/10 border border-error/30 text-error px-6 py-4 rounded-lg flex items-center gap-3">
            <span className="material-symbols-outlined">error</span>
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        )}
        {successMessage && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400 px-6 py-4 rounded-lg flex items-center gap-3">
            <span className="material-symbols-outlined">check_circle</span>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Intro Section */}
        <section className="space-y-4">
          <p className="font-headline text-label-sm font-bold uppercase tracking-[0.2em] text-primary">Explorer Preferences</p>
          <h3 className="font-headline text-4xl md:text-5xl font-extrabold text-on-surface leading-tight">Configure Your <br/><span className="text-secondary italic">Atlas Experience</span></h3>
          <p className="text-on-surface-variant max-w-xl text-lg">Adjust your navigation tools, notification beacons, and linguistic maps to better suit your global exploration.</p>
        </section>

        {/* Bento Grid Form Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Preferences Section */}
          <div className="md:col-span-8 space-y-6">
            <div className="bg-surface-container-low p-8 rounded-lg space-y-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>language</span>
                <h4 className="font-headline text-xl font-bold">Language</h4>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                GeoDaily is English-only today. Questions, navigation, and country names use English. More
                languages may come later.
              </p>
            </div>

            <div className="bg-surface-container-low p-8 rounded-lg space-y-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>storage</span>
                <h4 className="font-headline text-xl font-bold">Your Data</h4>
              </div>
              <p className="text-sm text-on-surface-variant">
                Export a backup of challenge history and stats, or reset progress while keeping these settings.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleExportProgress}
                  className="px-6 py-3 bg-surface-container-highest text-on-surface font-bold rounded-full text-sm hover:bg-surface-container-high transition-colors"
                >
                  Export progress
                </button>
                <button
                  type="button"
                  onClick={handleResetProgress}
                  className="px-6 py-3 bg-error/10 text-error font-bold rounded-full text-sm hover:bg-error/20 transition-colors"
                >
                  Reset progress
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar Forms */}
          <div className="md:col-span-4 space-y-8">
            {/* Notification Reminders */}
            <div className="bg-surface-container-highest p-8 rounded-lg space-y-8">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>alarm</span>
                <h4 className="font-headline text-lg font-bold">Daily Reminders</h4>
              </div>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-on-surface">Enable Reminders</span>
                  <Toggle
                    enabled={settings?.dailyReminderEnabled ?? true}
                    onToggle={() => updateSetting('dailyReminderEnabled', !settings?.dailyReminderEnabled)}
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-label text-xs font-bold text-on-surface-variant px-1">Reminder Time</label>
                  <div className="flex items-center gap-2">
                    <input 
                      className="flex-1 bg-surface-container-lowest border-none rounded p-3 text-on-surface focus:ring-2 focus:ring-primary/20 transition-all outline-none text-center font-bold" 
                      type="time" 
                      value={settings?.dailyReminderTime || '09:00'}
                      onChange={(e) => updateSetting('dailyReminderTime', e.target.value)}
                      disabled={isSaving || !settings?.dailyReminderEnabled}
                    />
                    <span className="bg-primary-container text-on-primary-container p-3 rounded-full material-symbols-outlined">schedule</span>
                  </div>
                </div>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  Reminders use browser notifications while this tab is open. For reliable alerts, keep GeoDaily
                  installed or bookmarked and allow notifications.
                </p>
              </div>
            </div>

            {/* Appearance */}
            <div className="bg-surface-container p-8 rounded-lg space-y-6">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 1" }}>palette</span>
                <h4 className="font-headline text-lg font-bold">Appearance</h4>
              </div>
              <div className="space-y-2">
                <label className="font-label text-xs font-bold text-on-surface-variant px-1">Theme</label>
                <select
                  className="w-full bg-surface-container-lowest border-none rounded p-3 text-on-surface outline-none"
                  value={settings?.theme || 'system'}
                  onChange={(e) => updateSetting('theme', e.target.value)}
                  disabled={isSaving}
                >
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
            </div>

            {/* Game Preferences */}
            <div className="bg-surface-container p-8 rounded-lg space-y-6">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 1" }}>videogame_asset</span>
                <h4 className="font-headline text-lg font-bold">Game Feel</h4>
              </div>
              <div className="space-y-5">
                <div className="flex items-center justify-between group">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-on-surface">Haptic Feedback</span>
                    <span className="text-[10px] text-on-surface-variant">Vibration on discovery</span>
                  </div>
                  <Toggle
                    enabled={settings?.hapticEnabled ?? true}
                    onToggle={() =>
                      void handleInstantGamePreference('hapticEnabled', !settings?.hapticEnabled)
                    }
                    disabled={isSaving}
                  />
                </div>
                <div className="flex items-center justify-between group">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-on-surface">Atmospheric Sound</span>
                    <span className="text-[10px] text-on-surface-variant">Environmental SFX</span>
                  </div>
                  <Toggle
                    enabled={settings?.soundEnabled ?? true}
                    onToggle={() =>
                      void handleInstantGamePreference('soundEnabled', !settings?.soundEnabled)
                    }
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <footer className="pt-8 border-t-0 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <p className="text-on-surface-variant text-sm">Preferences are saved on this device.</p>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <button 
              onClick={handleReset}
              disabled={!hasChanges || isSaving}
              className={`flex-1 md:flex-none px-8 py-4 text-on-surface-variant font-bold hover:bg-surface-container transition-colors rounded-full ${
                (!hasChanges || isSaving) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Reset Changes
            </button>
            <button 
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className={`flex-1 md:flex-none px-12 py-4 bg-gradient-to-r from-primary to-primary-dim text-on-primary font-bold rounded-full shadow-lg shadow-primary/20 transition-all ${
                (!hasChanges || isSaving) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95'
              }`}
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                'Save All Changes'
              )}
            </button>
          </div>
        </footer>
      </div>
  );
}
