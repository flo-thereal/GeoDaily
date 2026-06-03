import { useNavigate } from 'react-router-dom';
import { Play, Flame, Star, CheckCircle2, History, ChevronRight, Flag, Building2, Map } from 'lucide-react';
import { useStore } from '../store/useStore';
import { localDateString } from '../lib/utils';

export function Dashboard() {
  const navigate = useNavigate();
  const stats = useStore((s) => s.progress.stats);
  const history = useStore((s) => s.history);

  // All progress is local now — stats are always available.
  const streak = stats.currentStreak;
  const points = stats.totalPoints;

  // Generate last 7 days
  const today = new Date();
  const todayStr = localDateString(today);
  const isDailyCompleted = history[todayStr]?.completed || false;
  
  const pastDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (i + 1));
    return localDateString(d);
  });

  return (
    <div className="p-6 md:p-10 space-y-10 max-w-5xl mx-auto">
      {/* Header */}
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-headline font-black text-on-surface">Hello, Explorer! 👋</h1>
          <p className="text-on-surface-variant mt-2 text-lg">Ready for your daily geography challenge?</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 bg-surface-container-high px-4 py-2 rounded-full font-bold shadow-sm">
            <Flame className="w-5 h-5 text-tertiary-container" />
            <span className="text-lg">{streak}</span>
          </div>
          <div className="flex items-center gap-2 bg-surface-container-high px-4 py-2 rounded-full font-bold shadow-sm">
            <Star className="w-5 h-5 text-yellow-500" />
            <span className="text-lg">{points}</span>
          </div>
        </div>
      </header>

      {/* Daily Challenge Card */}
      <section>
        <div className="bg-gradient-to-br from-primary to-primary-dim text-on-primary rounded-3xl p-8 relative overflow-hidden shadow-xl shadow-primary/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-1/3 -translate-x-1/4 blur-xl" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-bold mb-4 uppercase tracking-wider">
                <Star className="w-4 h-4" />
                {isDailyCompleted ? 'Daily Quest Completed' : 'Daily Quest Available'}
              </div>
              <h2 className="text-4xl font-headline font-black mb-3">Today's Challenge</h2>
              <p className="text-on-primary/90 mb-0 max-w-md text-lg leading-relaxed">
                {isDailyCompleted 
                  ? "You've successfully completed today's challenge. Come back tomorrow for more!" 
                  : "Test your knowledge with 5 quick questions about flags, capitals, and map locations."}
              </p>
            </div>
            
            <div className="shrink-0">
              {isDailyCompleted ? (
                <button 
                  onClick={() => navigate(`/quiz/daily?date=${todayStr}&review=true`)}
                  className="bg-white/20 hover:bg-white/30 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all active:scale-95"
                >
                  <CheckCircle2 className="w-6 h-6" />
                  Review Answers
                </button>
              ) : (
                <button 
                  onClick={() => navigate(`/quiz/daily?date=${todayStr}`)}
                  className="bg-white text-primary px-8 py-4 rounded-2xl font-black text-lg flex items-center gap-3 hover:scale-105 transition-all shadow-lg active:scale-95"
                >
                  <Play className="w-6 h-6" fill="currentColor" />
                  Play Now
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Practice Hub */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-primary-container text-on-primary-container p-2 rounded-lg">
            <Flag className="w-5 h-5" />
          </div>
          <h3 className="text-2xl font-headline font-bold text-on-surface">Quick Practice</h3>
        </div>
        <p className="text-on-surface-variant mb-4">Sharpen your skills — practice counts toward skill achievements, not streaks or daily points.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/quiz/flags')}
            className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 hover:border-primary/30 hover:shadow-md transition-all text-left"
          >
            <Flag className="w-6 h-6 text-primary mb-2" />
            <h4 className="font-bold text-on-surface">Flags</h4>
            <p className="text-sm text-outline mt-1">Identify countries by flag</p>
          </button>
          <button
            onClick={() => navigate('/quiz/capitals')}
            className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 hover:border-primary/30 hover:shadow-md transition-all text-left"
          >
            <Building2 className="w-6 h-6 text-secondary mb-2" />
            <h4 className="font-bold text-on-surface">Capitals</h4>
            <p className="text-sm text-outline mt-1">Match capitals to countries</p>
          </button>
          <button
            onClick={() => navigate('/quiz/map')}
            className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 hover:border-primary/30 hover:shadow-md transition-all text-left"
          >
            <Map className="w-6 h-6 text-tertiary mb-2" />
            <h4 className="font-bold text-on-surface">Map</h4>
            <p className="text-sm text-outline mt-1">Pin locations on the world map</p>
          </button>
        </div>
      </section>

      {/* Past Dailies */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-secondary-container text-on-secondary-container p-2 rounded-lg">
            <History className="w-5 h-5" />
          </div>
          <h3 className="text-2xl font-headline font-bold text-on-surface">Past Expeditions</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pastDays.map((dateStr) => {
            const dayHistory = history[dateStr];
            const dateObj = new Date(dateStr);
            const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            
            return (
              <div key={dateStr} className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 hover:border-primary/30 hover:shadow-md transition-all group flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-lg text-on-surface">{formattedDate}</h4>
                    <p className="text-sm text-outline font-medium">Daily Challenge</p>
                  </div>
                  {dayHistory ? (
                    <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {dayHistory.score}/500
                    </div>
                  ) : (
                    <div className="bg-surface-container-high text-on-surface-variant px-2.5 py-1 rounded-md text-xs font-bold">
                      Missed
                    </div>
                  )}
                </div>
                
                <div className="mt-auto pt-4">
                  {dayHistory ? (
                    <button 
                      onClick={() => navigate(`/quiz/daily?date=${dateStr}&review=true`)}
                      className="w-full py-2.5 bg-surface-container text-on-surface font-bold text-sm rounded-xl hover:bg-surface-container-high transition-colors flex items-center justify-center gap-2"
                    >
                      Review Answers
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button 
                      onClick={() => navigate(`/quiz/daily?date=${dateStr}`)}
                      className="w-full py-2.5 bg-secondary/10 text-secondary font-bold text-sm rounded-xl hover:bg-secondary/20 transition-colors flex items-center justify-center gap-2"
                    >
                      Play (No Streak)
                      <Play className="w-4 h-4" fill="currentColor" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
