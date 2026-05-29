/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Quiz } from './pages/Quiz';
import { QuestCompleted } from './pages/QuestCompleted';
import { Explore } from './pages/Explore';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { Welcome } from './pages/Welcome';

export default function App() {
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
