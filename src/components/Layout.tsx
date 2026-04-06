import { Outlet, Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';

export function Layout() {
  const location = useLocation();

  const navItems = [
    { icon: 'explore', label: 'Exploration', path: '/' },
    { icon: 'map', label: 'Atlas', path: '/atlas' },
    { icon: 'settings', label: 'Settings', path: '/settings' },
  ];

  const bottomNavItems = [
    { icon: 'explore', label: 'Explore', path: '/' },
    { icon: 'map', label: 'Atlas', path: '/atlas' },
    { icon: 'settings', label: 'Settings', path: '/settings' },
  ];

  return (
    <div className="flex h-screen bg-surface text-on-surface overflow-hidden">
      {/* SideNavBar (Desktop) */}
      <aside className="hidden md:flex flex-col h-full py-8 space-y-2 bg-blue-50 dark:bg-slate-900 w-72 rounded-r-none border-r-0 sticky top-0 font-['Plus_Jakarta_Sans'] text-sm font-semibold">
        <div className="px-8 mb-10">
          <h1 className="text-2xl font-black text-green-800 dark:text-green-300">GeoDaily</h1>
          <p className="text-slate-500 text-[10px] uppercase tracking-widest mt-1">The Cartographic Canvas</p>
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
                    "flex items-center px-6 py-3 mx-2 my-1 rounded-full transition-all group active:scale-95 duration-200",
                    isActive 
                      ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200" 
                      : "text-slate-600 dark:text-slate-400 hover:bg-green-50 dark:hover:bg-slate-800"
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
          <Link to="/profile" className="bg-blue-100 dark:bg-slate-800 p-4 rounded-lg flex items-center space-x-3 hover:bg-blue-200 transition-colors">
            <img alt="GeoDaily Explorer Avatar" className="w-10 h-10 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBi1Uz4nTDCA86BFai3i9dHTWkcG2CbuP7IamAnXKSPvEqTJYzgYuhlipUdJv-SZQHLhRgdHXzqjn5amSt1ZkJMZk5DFy2uPLKHqF5GG-ZmV45Og_SRLNKE_yCdj9p_-m4LItDCGymK2yB_8PNpUqDE9YY7Mq3IH6TpsNhQfEWEmejf52INdaxJGUGgk3HqkDaHXi0nlmauYgLYo2nUZyAAjXxAuVhvfdKNIY-0D_TAoHDdBGGwCpaFzfjjQ07ksF3RTl31G1jLAGg0"/>
            <div>
              <p className="text-on-surface font-bold text-xs">The Canvas</p>
              <p className="text-slate-500 text-[10px]">Master Cartographer</p>
            </div>
          </Link>
          <Link to="/quiz/daily" className="block text-center w-full mt-4 bg-gradient-to-r from-primary to-primary-dim text-on-primary py-3 rounded-full font-bold text-sm shadow-sm hover:scale-[0.98] active:scale-95 transition-all">
            Daily Discovery
          </Link>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto no-scrollbar relative bg-surface pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Bottom Navigation (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-blue-50/90 backdrop-blur-lg flex justify-around items-center py-4 px-6 z-50">
        {bottomNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1",
                isActive ? "text-green-700 dark:text-green-400" : "text-slate-600 dark:text-slate-400"
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
