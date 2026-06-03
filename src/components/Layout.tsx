import { Outlet, Link, useLocation } from 'react-router-dom';
import { cn, localDateString } from '../lib/utils';
import { useStore } from '../store/useStore';

const isDev = import.meta.env.DEV;

export function Layout() {
  const location = useLocation();
  const todayStr = localDateString();

  const navItems = [
    { icon: 'home', label: 'Home', path: '/' },
    { icon: 'map', label: 'Atlas', path: '/atlas' },
    { icon: 'person', label: 'Profile', path: '/profile' },
    { icon: 'settings', label: 'Settings', path: '/settings' },
  ];

  const bottomNavItems = navItems;

  return (
    <div className="flex h-screen bg-surface text-on-surface overflow-hidden">
      <aside className="hidden md:flex flex-col h-full py-8 space-y-2 bg-blue-50 dark:bg-slate-900 w-72 rounded-r-none border-r-0 sticky top-0 font-['Plus_Jakarta_Sans'] text-sm font-semibold">
        <div className="px-8 mb-10">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-green-800 dark:text-green-300">GeoDaily</h1>
            {isDev && (
              <span className="px-1.5 py-0.5 text-[8px] font-bold uppercase bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 rounded">
                Dev
              </span>
            )}
          </div>
          <p className="text-slate-500 text-[10px] uppercase tracking-widest mt-1">Daily geography drills</p>
        </div>
        <div className="flex-1 space-y-1">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center px-6 py-3 mx-2 my-1 rounded-full transition-all group active:scale-95 duration-200',
                    isActive
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-green-50 dark:hover:bg-slate-800'
                  )}
                >
                  <span
                    className="material-symbols-outlined mr-3"
                    style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="px-6 mt-auto">
          <Link
            to={`/quiz/daily?date=${todayStr}`}
            className="block text-center w-full bg-gradient-to-r from-primary to-primary-dim text-on-primary py-3 rounded-full font-bold text-sm shadow-sm hover:scale-[0.98] active:scale-95 transition-all"
          >
            Daily Discovery
          </Link>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-y-auto no-scrollbar relative bg-surface pb-20 md:pb-0">
        <Outlet />
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-blue-50/90 backdrop-blur-lg flex justify-around items-center py-4 px-6 z-50">
        {bottomNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center gap-1',
                isActive ? 'text-green-700 dark:text-green-400' : 'text-slate-600 dark:text-slate-400'
              )}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {item.icon}
              </span>
              <span className="text-[10px] font-bold">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
