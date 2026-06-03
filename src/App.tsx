/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useStore } from './store/useStore';
import { setGamePreferences } from './lib/preferences';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Quiz } from './pages/Quiz';
import { QuestCompleted } from './pages/QuestCompleted';
import { Explore } from './pages/Explore';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { Welcome } from './pages/Welcome';

export default function App() {
  const settings = useStore((s) => s.settings);

  useEffect(() => {
    const theme = (settings.theme === 'dark' || settings.theme === 'light'
      ? settings.theme
      : 'system') as 'light' | 'dark' | 'system';
    setGamePreferences({
      theme,
      soundEnabled: settings.soundEnabled,
      hapticEnabled: settings.hapticEnabled,
    });
    if (settings.dailyReminderEnabled) {
      import('./lib/reminders').then(({ syncDailyReminder }) =>
        syncDailyReminder(true, settings.dailyReminderTime)
      );
    }
  }, [settings]);

  return (
    <Routes>
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="explore" element={<Explore />} />
        <Route path="atlas" element={<Explore />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="/quiz/:type" element={<Quiz />} />
      <Route path="/quest-completed" element={<QuestCompleted />} />
    </Routes>
  );
}
