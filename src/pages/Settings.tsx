import { useState } from 'react';
import { setGamePreferences } from '../lib/preferences';
import { useStore } from '../store/useStore';

export function Settings() {
  const theme = useStore((s) => s.settings.theme);
  const updateStoreSettings = useStore((s) => s.updateSettings);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleThemeChange = (nextTheme: string) => {
    updateStoreSettings({ theme: nextTheme });
    const normalized = (nextTheme === 'dark' || nextTheme === 'light'
      ? nextTheme
      : 'system') as 'light' | 'dark' | 'system';
    setGamePreferences({ theme: normalized });
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
        'Reset all progress on this device? Your streak and challenge history will be deleted. This cannot be undone.'
      )
    ) {
      useStore.getState().resetAllProgress();
      setSuccessMessage('Progress reset. Your preferences were kept.');
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  return (
    <div className="p-6 md:p-12 max-w-5xl mx-auto w-full space-y-12">
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
        <p className="text-on-surface-variant max-w-xl text-lg">Adjust the look and feel, and manage the data stored on this device.</p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Your Data */}
        <div className="md:col-span-8 space-y-6">
          <div className="bg-surface-container-low p-8 rounded-lg space-y-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>storage</span>
              <h4 className="font-headline text-xl font-bold">Your Data</h4>
            </div>
            <p className="text-sm text-on-surface-variant">
              Export a backup of your challenge history, or reset progress while keeping your theme.
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

        {/* Appearance */}
        <div className="md:col-span-4 space-y-8">
          <div className="bg-surface-container p-8 rounded-lg space-y-6">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 1" }}>palette</span>
              <h4 className="font-headline text-lg font-bold">Appearance</h4>
            </div>
            <div className="space-y-2">
              <label className="font-label text-xs font-bold text-on-surface-variant px-1">Theme</label>
              <select
                className="w-full bg-surface-container-lowest border-none rounded p-3 text-on-surface outline-none"
                value={theme}
                onChange={(e) => handleThemeChange(e.target.value)}
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <footer className="pt-8 flex items-center justify-between gap-6">
        <p className="text-on-surface-variant text-sm">Preferences are saved on this device.</p>
      </footer>
    </div>
  );
}
