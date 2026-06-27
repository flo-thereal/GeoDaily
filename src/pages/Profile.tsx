import { useState, useEffect, useMemo } from 'react';
import { getCurrentUser, UserProfile, getLearningHistory, LearningHistoryEntry } from '../services/api';
import { localDateString } from '../lib/utils';

// Default placeholder avatar
const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?name=Explorer&background=6366f1&color=fff&size=160';

// Achievement icon mapping
const ACHIEVEMENT_ICONS: Record<string, { icon: string; bgClass: string; textClass: string }> = {
  progress: { icon: 'flag', bgClass: 'bg-primary-container', textClass: 'text-on-primary-container' },
  streak: { icon: 'local_fire_department', bgClass: 'bg-tertiary-container', textClass: 'text-on-tertiary-container' },
  accuracy: { icon: 'star', bgClass: 'bg-secondary-container', textClass: 'text-on-secondary-container' },
  mastery: { icon: 'public', bgClass: 'bg-secondary-container', textClass: 'text-on-secondary-container' },
  continent: { icon: 'map', bgClass: 'bg-primary-container', textClass: 'text-on-primary-container' },
  points: { icon: 'auto_awesome', bgClass: 'bg-tertiary-container', textClass: 'text-on-tertiary-container' },
  skill: { icon: 'school', bgClass: 'bg-primary-container', textClass: 'text-on-primary-container' },
  default: { icon: 'emoji_events', bgClass: 'bg-surface-container-high', textClass: 'text-on-surface-variant' },
};

function getAchievementStyle(category: string) {
  return ACHIEVEMENT_ICONS[category] || ACHIEVEMENT_ICONS.default;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'TODAY';
  if (diffDays === 1) return '1 DAY AGO';
  if (diffDays < 7) return `${diffDays} DAYS AGO`;
  if (diffDays < 14) return '1 WEEK AGO';
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} WEEKS AGO`;
  if (diffDays < 60) return '1 MONTH AGO';
  return `${Math.floor(diffDays / 30)} MONTHS AGO`;
}

function formatShortDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [learningHistory, setLearningHistory] = useState<LearningHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyDays, setHistoryDays] = useState(30);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const [profileData, historyData] = await Promise.all([
          getCurrentUser(),
          getLearningHistory(historyDays),
        ]);
        setProfile(profileData);
        setLearningHistory(historyData);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [historyDays]);

  // Calculate chart data from learning history
  const chartData = useMemo(() => {
    if (learningHistory.length === 0) return { bars: [], maxScore: 5, labels: { start: '', mid: '', end: '' } };
    
    const maxScore = Math.max(...learningHistory.map(h => h.score), 5);
    const bars = learningHistory.map(entry => ({
      date: entry.date,
      height: maxScore > 0 ? (entry.score / maxScore) * 100 : 0,
      score: entry.score,
      isToday: entry.date === localDateString(),
    }));
    
    // Only show a subset of bars for readability (every 3rd bar for 30 days = ~10 bars)
    const step = Math.max(1, Math.floor(bars.length / 12));
    const displayBars = bars.filter((_, i) => i % step === 0 || i === bars.length - 1);
    
    return {
      bars: displayBars,
      maxScore,
      labels: {
        start: learningHistory.length > 0 ? formatShortDate(learningHistory[0].date) : '',
        mid: learningHistory.length > 15 ? formatShortDate(learningHistory[Math.floor(learningHistory.length / 2)].date) : '',
        end: learningHistory.length > 0 ? formatShortDate(learningHistory[learningHistory.length - 1].date) : '',
      },
    };
  }, [learningHistory]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-outline font-headline">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8 py-12">
        <span className="material-symbols-outlined text-6xl text-error mb-6">error</span>
        <h2 className="text-2xl font-headline font-bold text-on-surface mb-2">Unable to load profile</h2>
        <p className="text-outline mb-8">{error || 'Something went wrong'}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-primary text-on-primary px-6 py-3 rounded-full font-headline font-bold hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { stats, continentMastery, achievements } = profile;

  return (
    <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Hero Profile Section */}
        <section className="relative mb-16">
          <div className="flex flex-col md:flex-row items-end md:items-center gap-8">
            <div className="relative group">
              <div className="w-40 h-40 rounded-full bg-gradient-to-br from-primary to-secondary p-1">
                <div className="w-full h-full rounded-full bg-surface-container-lowest overflow-hidden border-4 border-surface">
                  <img alt="Explorer Portrait" className="w-full h-full object-cover" src={profile.avatarUrl || DEFAULT_AVATAR}/>
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-tertiary-container text-on-tertiary-container px-4 py-1 rounded-full font-headline font-black text-lg shadow-lg">
                LVL {profile.level}
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-5xl font-headline font-extrabold tracking-tight text-on-surface">{profile.displayName}</h2>
                {profile.level >= 10 && (
                  <span className="material-symbols-outlined text-tertiary-fixed text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                )}
              </div>
              <p className="text-xl text-outline font-medium mb-6">{profile.title || 'Geography Explorer'}</p>
              <div className="flex gap-4">
                {stats.countriesMastered >= 50 && (
                  <div className="bg-surface-container-low px-4 py-2 rounded-lg flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">public</span>
                    <span className="text-sm font-headline font-bold text-on-surface-variant">Global Citizen</span>
                  </div>
                )}
                <div className="bg-surface-container-low px-4 py-2 rounded-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">local_fire_department</span>
                  <span className="text-sm font-headline font-bold text-on-surface-variant">{stats.currentStreak} Day Streak</span>
                </div>
              </div>
            </div>
            <div className="hidden lg:block w-64 h-32 opacity-20 grayscale hover:grayscale-0 transition-all">
              <img alt="Vintage map sketch" className="w-full h-full object-contain" src={`${import.meta.env.BASE_URL}images/profile-map-sketch.jpg`} />
            </div>
          </div>
        </section>

        {/* Stats Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {/* Days Active */}
          <div className="bg-surface-container-lowest p-8 rounded-lg shadow-sm border border-outline-variant/10 group hover:bg-primary/5 transition-colors">
            <span className="material-symbols-outlined text-primary text-3xl mb-4">calendar_today</span>
            <h3 className="text-sm font-headline font-bold text-outline uppercase tracking-wider mb-1">Days Active</h3>
            <p className="text-4xl font-headline font-black text-on-surface">{stats.totalDaysPlayed}</p>
            <div className="mt-4 h-1 bg-surface-container-high rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-700 ease-out" style={{ width: `${Math.min(stats.totalDaysPlayed / 365 * 100, 100)}%` }}></div>
            </div>
          </div>

          {/* Countries Mastered */}
          <div className="bg-surface-container-lowest p-8 rounded-lg shadow-sm border border-outline-variant/10 group hover:bg-secondary/5 transition-colors">
            <span className="material-symbols-outlined text-secondary text-3xl mb-4">flag</span>
            <h3 className="text-sm font-headline font-bold text-outline uppercase tracking-wider mb-1">Countries Mastered</h3>
            <p className="text-4xl font-headline font-black text-on-surface">{stats.countriesMastered}</p>
            <div className="mt-4 h-1 bg-surface-container-high rounded-full overflow-hidden">
              <div className="h-full bg-secondary rounded-full transition-all duration-700 ease-out" style={{ width: `${Math.min(stats.countriesMastered / 195 * 100, 100)}%` }}></div>
            </div>
          </div>

          {/* Average Accuracy */}
          <div className="bg-surface-container-lowest p-8 rounded-lg shadow-sm border border-outline-variant/10 group hover:bg-tertiary/5 transition-colors">
            <span className="material-symbols-outlined text-tertiary text-3xl mb-4">target</span>
            <h3 className="text-sm font-headline font-bold text-outline uppercase tracking-wider mb-1">Avg Accuracy</h3>
            <p className="text-4xl font-headline font-black text-on-surface">{stats.accuracy}<span className="text-2xl">%</span></p>
            <div className="mt-4 h-1 bg-surface-container-high rounded-full overflow-hidden">
              <div className="h-full bg-tertiary rounded-full transition-all duration-700 ease-out" style={{ width: `${stats.accuracy}%` }}></div>
            </div>
          </div>

          {/* Total Points */}
          <div className="bg-surface-container-lowest p-8 rounded-lg shadow-sm border border-outline-variant/10 group hover:bg-on-surface/5 transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant text-3xl mb-4">trophy</span>
            <h3 className="text-sm font-headline font-bold text-outline uppercase tracking-wider mb-1">Total Points</h3>
            <p className="text-4xl font-headline font-black text-on-surface">{stats.totalPoints.toLocaleString()}</p>
            <p className="text-xs font-bold text-primary mt-4 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">local_fire_department</span>
              Best streak: {stats.longestStreak} days
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Learning History Chart */}
          <div className="lg:col-span-2 bg-surface-container-low p-8 rounded-lg">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="text-2xl font-headline font-extrabold text-on-surface">Learning History</h3>
                <p className="text-sm text-outline font-medium">Points earned over the last {historyDays} days</p>
              </div>
              <select 
                value={historyDays}
                onChange={(e) => setHistoryDays(Number(e.target.value))}
                className="bg-surface-container-lowest border-none rounded-full px-4 py-2 text-sm font-headline font-bold text-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value={30}>Last 30 Days</option>
                <option value={90}>Last 3 Months</option>
                <option value={180}>Last 6 Months</option>
              </select>
            </div>
            {/* Visual Chart Representation - Real Data */}
            <div className="h-64 flex items-end justify-between gap-2 group">
              {chartData.bars.length > 0 ? (
                chartData.bars.map((bar, index) => (
                  <div
                    key={bar.date}
                    className={`w-full ${bar.isToday ? 'bg-primary' : 'bg-primary/20'} hover:bg-primary transition-all duration-700 ease-out rounded-t-lg relative group/bar`}
                    style={{ height: `${Math.max(bar.height, 2)}%` }}
                    title={`${formatShortDate(bar.date)}: ${bar.score} points`}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface-container-highest px-2 py-1 rounded text-xs font-bold text-on-surface opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap">
                      {bar.score} pts
                    </div>
                  </div>
                ))
              ) : (
                <div className="w-full h-full flex items-center justify-center text-outline">
                  <div className="text-center">
                    <span className="material-symbols-outlined text-4xl mb-2">bar_chart</span>
                    <p className="text-sm">No activity yet. Complete challenges to see your progress!</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-between mt-4 text-[10px] font-headline font-bold text-outline uppercase tracking-widest">
              <span>{chartData.labels.start}</span>
              <span>{chartData.labels.mid}</span>
              <span>{chartData.labels.end || 'Today'}</span>
            </div>
          </div>

          {/* Knowledge Breakdown */}
          <div className="bg-surface-container-high p-8 rounded-lg relative overflow-hidden">
            <h3 className="text-2xl font-headline font-extrabold text-on-surface mb-8">Continent Mastery</h3>
            <div className="space-y-6 relative z-10">
              {(['Europe', 'Asia', 'Americas', 'Africa', 'Oceania'] as const).map((continent) => {
                const mastery = continentMastery[continent] || 0;
                const colorClass = mastery >= 60 ? 'text-primary' : mastery >= 30 ? 'text-tertiary' : 'text-error';
                const bgClass = mastery >= 60 ? 'bg-primary' : mastery >= 30 ? 'bg-tertiary' : 'bg-error-container';
                return (
                  <div key={continent}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-headline font-bold text-on-surface-variant">{continent}</span>
                      <span className={`text-sm font-headline font-black ${colorClass}`}>{mastery}%</span>
                    </div>
                    <div className="h-2 bg-surface-container-lowest rounded-full overflow-hidden">
                      <div className={`h-full ${bgClass} rounded-full transition-all duration-700 ease-out`} style={{ width: `${mastery}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Decorative background icon */}
            <span className="material-symbols-outlined absolute -bottom-10 -right-10 text-[180px] text-surface-container opacity-30 select-none">public</span>
          </div>
        </div>

        {/* Recent Achievements Section */}
        <section className="mt-16">
          <h3 className="text-3xl font-headline font-extrabold text-on-surface mb-8">Recent Landmarks</h3>
          {achievements.length === 0 ? (
            <div className="bg-surface-container-lowest p-8 rounded-lg border border-outline-variant/10 text-center">
              <span className="material-symbols-outlined text-4xl text-outline mb-4">emoji_events</span>
              <p className="text-outline">Complete challenges to earn achievements!</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-4">
              {achievements.slice(0, 6).map((achievement) => {
                const style = getAchievementStyle(achievement.category);
                return (
                  <div key={achievement.id} className="bg-surface-container-lowest p-6 rounded-lg flex items-center gap-4 border border-outline-variant/10 max-w-sm">
                    <div className={`w-16 h-16 rounded-full ${style.bgClass} flex items-center justify-center`}>
                      <span className={`material-symbols-outlined ${style.textClass} text-3xl`} style={{ fontVariationSettings: "'FILL' 1" }}>{achievement.icon || style.icon}</span>
                    </div>
                    <div>
                      <h4 className="font-headline font-bold text-on-surface">{achievement.name}</h4>
                      <p className="text-xs text-outline">{achievement.description}</p>
                      <p className="text-[10px] text-primary font-bold mt-1">EARNED {formatTimeAgo(achievement.earnedAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
  );
}
