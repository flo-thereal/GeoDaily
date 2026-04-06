export function Profile() {
  return (
    <>
      <header className="w-full sticky top-0 z-50 bg-blue-50/80 dark:bg-slate-900/80 backdrop-blur-xl flex justify-between items-center px-8 py-4">
        <div className="flex items-center space-x-2">
          <span className="material-symbols-outlined text-green-700 dark:text-green-400">history_edu</span>
          <span className="font-headline font-bold text-base text-slate-600 dark:text-slate-400">Explorer Profile</span>
        </div>
        <div className="flex items-center space-x-4">
          <button className="p-2 rounded-full hover:bg-white/50 dark:hover:bg-slate-700/50 transition-colors text-slate-600">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <div className="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant/20 overflow-hidden">
            <img alt="User profile settings" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD9YtgX9fC-zkmBNIw0Nw2Zl5_y4hcCFEqygY3Ilb_jZxFmgood8X89mBi0UZYr-67mguk3pcPXdTqhuVA_1IIEm0mqnX2ZawF5xa096It3JSp1Ja9Qepm86XEIVZdfYcpLAATHXVsu-pz77nbN85W4ZcEJqKgHmpveZwiElaNsVNkX22stpL7HMBeNiXfYcCgEwPpdFM85xnnFcmVBR9KgYR1Q4du3FUcUG96jryrx_dvIwGXxiRKqloQ9Vdw4z_IL6KwvNxHUOuia"/>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Hero Profile Section */}
        <section className="relative mb-16">
          <div className="flex flex-col md:flex-row items-end md:items-center gap-8">
            <div className="relative group">
              <div className="w-40 h-40 rounded-full bg-gradient-to-br from-primary to-secondary p-1">
                <div className="w-full h-full rounded-full bg-surface-container-lowest overflow-hidden border-4 border-surface">
                  <img alt="Explorer Portrait" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBEIg_CE9Bgz7GC2CXrbVwJgd6VMbGrw571DjirbTZQ31c7jNORdPilr63CBJnsdyo9ZZOq62uKuuS-DkARooXlxtbvMyvUGYt82TKpEu0ehLE83bP1FN_RRaRhnpt5XMY2UFIrmmxuxILAg3HDEjdfjU7_3RPf0fpcx1ibZ0H-ka4ciRQrA2u25BJ1RkAJKfK1v98T00ElSnRWSBISBHnnoZQWO5wbuyOGDqbChbNP8CO9TzIZkSboGWL1l4k_IIYhIxP_3PpdmiHs"/>
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-tertiary-container text-on-tertiary-container px-4 py-1 rounded-full font-headline font-black text-lg shadow-lg">
                LVL 42
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-5xl font-headline font-extrabold tracking-tight text-on-surface">The Canvas</h2>
                <span className="material-symbols-outlined text-tertiary-fixed text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              </div>
              <p className="text-xl text-outline font-medium mb-6">Master Cartographer</p>
              <div className="flex gap-4">
                <div className="bg-surface-container-low px-4 py-2 rounded-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">public</span>
                  <span className="text-sm font-headline font-bold text-on-surface-variant">Global Citizen</span>
                </div>
                <div className="bg-surface-container-low px-4 py-2 rounded-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">local_fire_department</span>
                  <span className="text-sm font-headline font-bold text-on-surface-variant">128 Day Streak</span>
                </div>
              </div>
            </div>
            <div className="hidden lg:block w-64 h-32 opacity-20 grayscale hover:grayscale-0 transition-all">
              <img alt="Vintage map sketch" className="w-full h-full object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCMo07jGyYcJ19m6ox5WXWmJdnasYSr2I2tQnL2yQxyNDLx4jkapbu51-J-4Kh3BHSj4j0ssW2xK31QS-qBVfjbEJbzNSSl-VErwa-DziNOhGACcz1q8OJVnkIEVq1gSGBKup3worzzbuwp6xf6WZC5FlK0xALKULvgnEYz3PdcsmkACTj6362MvjGnZheOw0VtK_ZsEHVwF2A-es--Jp9zTYlzJgzfuKIiK7mmxU8Adu_U839iOL_QaVFqaD0Pgc-EAtBChyP8TAoI"/>
            </div>
          </div>
        </section>

        {/* Stats Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {/* Days Active */}
          <div className="bg-surface-container-lowest p-8 rounded-lg shadow-sm border border-outline-variant/10 group hover:bg-primary/5 transition-colors">
            <span className="material-symbols-outlined text-primary text-3xl mb-4">calendar_today</span>
            <h3 className="text-sm font-headline font-bold text-outline uppercase tracking-wider mb-1">Days Active</h3>
            <p className="text-4xl font-headline font-black text-on-surface">342</p>
            <div className="mt-4 h-1 bg-surface-container-high rounded-full overflow-hidden">
              <div className="h-full bg-primary w-3/4 rounded-full"></div>
            </div>
          </div>

          {/* Countries Mastered */}
          <div className="bg-surface-container-lowest p-8 rounded-lg shadow-sm border border-outline-variant/10 group hover:bg-secondary/5 transition-colors">
            <span className="material-symbols-outlined text-secondary text-3xl mb-4">flag</span>
            <h3 className="text-sm font-headline font-bold text-outline uppercase tracking-wider mb-1">Countries Mastered</h3>
            <p className="text-4xl font-headline font-black text-on-surface">84</p>
            <div className="mt-4 h-1 bg-surface-container-high rounded-full overflow-hidden">
              <div className="h-full bg-secondary w-2/5 rounded-full"></div>
            </div>
          </div>

          {/* Average Accuracy */}
          <div className="bg-surface-container-lowest p-8 rounded-lg shadow-sm border border-outline-variant/10 group hover:bg-tertiary/5 transition-colors">
            <span className="material-symbols-outlined text-tertiary text-3xl mb-4">target</span>
            <h3 className="text-sm font-headline font-bold text-outline uppercase tracking-wider mb-1">Avg Accuracy</h3>
            <p className="text-4xl font-headline font-black text-on-surface">92<span className="text-2xl">%</span></p>
            <div className="mt-4 h-1 bg-surface-container-high rounded-full overflow-hidden">
              <div className="h-full bg-tertiary w-[92%] rounded-full"></div>
            </div>
          </div>

          {/* Global Rank */}
          <div className="bg-surface-container-lowest p-8 rounded-lg shadow-sm border border-outline-variant/10 group hover:bg-on-surface/5 transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant text-3xl mb-4">trophy</span>
            <h3 className="text-sm font-headline font-bold text-outline uppercase tracking-wider mb-1">Global Rank</h3>
            <p className="text-4xl font-headline font-black text-on-surface">#1,204</p>
            <p className="text-xs font-bold text-primary mt-4 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">trending_up</span>
              Top 2% this month
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Learning History Chart */}
          <div className="lg:col-span-2 bg-surface-container-low p-8 rounded-lg">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="text-2xl font-headline font-extrabold text-on-surface">Learning History</h3>
                <p className="text-sm text-outline font-medium">XP Gains over the last 30 days</p>
              </div>
              <select className="bg-surface-container-lowest border-none rounded-full px-4 py-2 text-sm font-headline font-bold text-primary focus:ring-2 focus:ring-primary/20">
                <option>Last 30 Days</option>
                <option>Last 6 Months</option>
              </select>
            </div>
            {/* Visual Chart Representation */}
            <div className="h-64 flex items-end justify-between gap-2 group">
              <div className="w-full bg-primary/20 hover:bg-primary transition-all rounded-t-lg" style={{ height: "40%" }}></div>
              <div className="w-full bg-primary/20 hover:bg-primary transition-all rounded-t-lg" style={{ height: "55%" }}></div>
              <div className="w-full bg-primary/20 hover:bg-primary transition-all rounded-t-lg" style={{ height: "35%" }}></div>
              <div className="w-full bg-primary/20 hover:bg-primary transition-all rounded-t-lg" style={{ height: "70%" }}></div>
              <div className="w-full bg-primary hover:bg-primary-dim transition-all rounded-t-lg" style={{ height: "90%" }}></div>
              <div className="w-full bg-primary/20 hover:bg-primary transition-all rounded-t-lg" style={{ height: "60%" }}></div>
              <div className="w-full bg-primary/20 hover:bg-primary transition-all rounded-t-lg" style={{ height: "45%" }}></div>
              <div className="w-full bg-primary/20 hover:bg-primary transition-all rounded-t-lg" style={{ height: "80%" }}></div>
              <div className="w-full bg-primary/20 hover:bg-primary transition-all rounded-t-lg" style={{ height: "50%" }}></div>
              <div className="w-full bg-primary/20 hover:bg-primary transition-all rounded-t-lg" style={{ height: "65%" }}></div>
              <div className="w-full bg-primary/20 hover:bg-primary transition-all rounded-t-lg" style={{ height: "40%" }}></div>
              <div className="w-full bg-primary/20 hover:bg-primary transition-all rounded-t-lg" style={{ height: "55%" }}></div>
            </div>
            <div className="flex justify-between mt-4 text-[10px] font-headline font-bold text-outline uppercase tracking-widest">
              <span>Oct 1</span>
              <span>Oct 15</span>
              <span>Today</span>
            </div>
          </div>

          {/* Knowledge Breakdown */}
          <div className="bg-surface-container-high p-8 rounded-lg relative overflow-hidden">
            <h3 className="text-2xl font-headline font-extrabold text-on-surface mb-8">Continent Mastery</h3>
            <div className="space-y-6 relative z-10">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-headline font-bold text-on-surface-variant">Europe</span>
                  <span className="text-sm font-headline font-black text-primary">85%</span>
                </div>
                <div className="h-2 bg-surface-container-lowest rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[85%] rounded-full"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-headline font-bold text-on-surface-variant">Asia</span>
                  <span className="text-sm font-headline font-black text-primary">62%</span>
                </div>
                <div className="h-2 bg-surface-container-lowest rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[62%] rounded-full"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-headline font-bold text-on-surface-variant">Americas</span>
                  <span className="text-sm font-headline font-black text-primary">54%</span>
                </div>
                <div className="h-2 bg-surface-container-lowest rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[54%] rounded-full"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-headline font-bold text-on-surface-variant">Africa</span>
                  <span className="text-sm font-headline font-black text-tertiary">40%</span>
                </div>
                <div className="h-2 bg-surface-container-lowest rounded-full overflow-hidden">
                  <div className="h-full bg-tertiary w-[40%] rounded-full"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-headline font-bold text-on-surface-variant">Oceania</span>
                  <span className="text-sm font-headline font-black text-error">12%</span>
                </div>
                <div className="h-2 bg-surface-container-lowest rounded-full overflow-hidden">
                  <div className="h-full bg-error-container w-[12%] rounded-full"></div>
                </div>
              </div>
            </div>
            {/* Decorative background icon */}
            <span className="material-symbols-outlined absolute -bottom-10 -right-10 text-[180px] text-surface-container opacity-30 select-none">public</span>
          </div>
        </div>

        {/* Recent Achievements Section */}
        <section className="mt-16">
          <h3 className="text-3xl font-headline font-extrabold text-on-surface mb-8">Recent Landmarks</h3>
          <div className="flex flex-wrap gap-4">
            <div className="bg-surface-container-lowest p-6 rounded-lg flex items-center gap-4 border border-outline-variant/10 max-w-sm">
              <div className="w-16 h-16 rounded-full bg-tertiary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-on-tertiary-container text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
              </div>
              <div>
                <h4 className="font-headline font-bold text-on-surface">Peak Explorer</h4>
                <p className="text-xs text-outline">Mastered all Alpine nations</p>
                <p className="text-[10px] text-primary font-bold mt-1">EARNED 2 DAYS AGO</p>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-6 rounded-lg flex items-center gap-4 border border-outline-variant/10 max-w-sm">
              <div className="w-16 h-16 rounded-full bg-secondary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-on-secondary-container text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>waves</span>
              </div>
              <div>
                <h4 className="font-headline font-bold text-on-surface">Archipelago Ace</h4>
                <p className="text-xs text-outline">Identified 50 island nations</p>
                <p className="text-[10px] text-primary font-bold mt-1">EARNED 1 WEEK AGO</p>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-6 rounded-lg flex items-center gap-4 border border-outline-variant/10 max-w-sm">
              <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary-container text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>speed</span>
              </div>
              <div>
                <h4 className="font-headline font-bold text-on-surface">Rapid Cartographer</h4>
                <p className="text-xs text-outline">Perfect score in under 60s</p>
                <p className="text-[10px] text-primary font-bold mt-1">EARNED 3 WEEKS AGO</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
