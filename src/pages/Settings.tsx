export function Settings() {
  return (
    <>
      {/* TopAppBar Mobile / Header */}
      <header className="w-full sticky top-0 z-50 bg-blue-50/80 dark:bg-slate-900/80 backdrop-blur-xl flex justify-between items-center px-6 py-4 no-border bg-blue-100/50 dark:bg-slate-800/50">
        <div className="flex items-center gap-4">
          <button className="md:hidden p-2 rounded-full hover:bg-white/50 transition-colors">
            <span className="material-symbols-outlined text-on-surface">menu</span>
          </button>
          <h2 className="font-['Plus_Jakarta_Sans'] font-extrabold text-xl tracking-tight text-green-800 dark:text-green-300">Settings</h2>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-full hover:bg-white/50 dark:hover:bg-slate-700/50 transition-colors scale-95 active:scale-90 transition-transform duration-200">
            <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">notifications</span>
          </button>
          <img alt="User profile settings" className="w-10 h-10 rounded-full border-2 border-primary-container" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD0l3QWh8UhmESWCrmx1YF_NcumrPnqvKpm_8H7ajBMAYhx36KWT_6b3IDiVPUparWetUi7CNKI2fefvhWjfJ5zyMsaAWcXxUZPPstRSPuZJRkmwpRq7cVRDQGS5baK0exgnsUXFe9PVXnWvOi9y3ioirACqZ_CmehGOW0ayFJOcBJ8e9FImFcJr1ZJLUEvgndCehv3GPRnkJ8pQIQlAK0qRKKuEMDdv1rfoYSgcRpro4hG5gMcHt_TnnM1IO-tf3zFHuN5cjPM-xUV"/>
        </div>
      </header>

      <div className="p-6 md:p-12 max-w-5xl mx-auto w-full space-y-12">
        {/* Intro Section */}
        <section className="space-y-4">
          <p className="font-headline text-label-sm font-bold uppercase tracking-[0.2em] text-primary">Explorer Preferences</p>
          <h3 className="font-headline text-4xl md:text-5xl font-extrabold text-on-surface leading-tight">Configure Your <br/><span className="text-secondary italic">Atlas Experience</span></h3>
          <p className="text-on-surface-variant max-w-xl text-lg">Adjust your navigation tools, notification beacons, and linguistic maps to better suit your global exploration.</p>
        </section>

        {/* Bento Grid Form Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Account Section */}
          <div className="md:col-span-8 space-y-6">
            <div className="bg-surface-container-low p-8 rounded-lg space-y-8">
              <div className="flex items-center gap-3 border-b-0">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span>
                <h4 className="font-headline text-xl font-bold">Account Security</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="font-label text-xs font-bold text-on-surface-variant px-1">Email Address</label>
                  <input className="w-full bg-surface-container-lowest border-none rounded p-4 text-on-surface focus:ring-2 focus:ring-primary/20 transition-all outline-none" placeholder="Enter your email" type="email" defaultValue="alex.explorer@geodaily.com"/>
                </div>
                <div className="space-y-2">
                  <label className="font-label text-xs font-bold text-on-surface-variant px-1">Current Password</label>
                  <div className="relative">
                    <input className="w-full bg-surface-container-lowest border-none rounded p-4 text-on-surface focus:ring-2 focus:ring-primary/20 transition-all outline-none" placeholder="Enter password" type="password" defaultValue="••••••••••••"/>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant cursor-pointer">visibility</span>
                  </div>
                </div>
              </div>
              <button className="bg-secondary-container text-on-secondary-container px-6 py-3 rounded-full font-bold text-sm hover:scale-[0.98] active:scale-95 transition-all">
                Update Security Credentials
              </button>
            </div>

            {/* Language Section */}
            <div className="bg-surface-container-low p-8 rounded-lg space-y-6">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>language</span>
                <h4 className="font-headline text-xl font-bold">Linguistic Map</h4>
              </div>
              <div className="space-y-2">
                <label className="font-label text-xs font-bold text-on-surface-variant px-1">Primary Discovery Language</label>
                <select className="w-full bg-surface-container-lowest border-none rounded p-4 text-on-surface focus:ring-2 focus:ring-primary/20 transition-all outline-none appearance-none">
                  <option defaultValue="English (International)">English (International)</option>
                  <option>Français (Monde)</option>
                  <option>Español (Global)</option>
                  <option>Deutsch</option>
                  <option>Português</option>
                </select>
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
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary transition-colors">
                    <span className="inline-block h-4 w-4 translate-x-6 transform rounded-full bg-white transition-transform"></span>
                  </button>
                </div>
                <div className="space-y-2">
                  <label className="font-label text-xs font-bold text-on-surface-variant px-1">Reminder Time</label>
                  <div className="flex items-center gap-2">
                    <input className="flex-1 bg-surface-container-lowest border-none rounded p-3 text-on-surface focus:ring-2 focus:ring-primary/20 transition-all outline-none text-center font-bold" type="time" defaultValue="09:00"/>
                    <span className="bg-primary-container text-on-primary-container p-3 rounded-full material-symbols-outlined">schedule</span>
                  </div>
                </div>
                <div className="p-4 rounded bg-surface/50 border border-white/20">
                  <p className="text-[11px] text-on-surface-variant leading-relaxed italic">"A consistent cartographer masters the world one day at a time."</p>
                </div>
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
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary transition-colors">
                    <span className="inline-block h-4 w-4 translate-x-6 transform rounded-full bg-white transition-transform"></span>
                  </button>
                </div>
                <div className="flex items-center justify-between group">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-on-surface">Atmospheric Sound</span>
                    <span className="text-[10px] text-on-surface-variant">Environmental SFX</span>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-outline-variant transition-colors">
                    <span className="inline-block h-4 w-4 translate-x-1 transform rounded-full bg-white transition-transform"></span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <footer className="pt-8 border-t-0 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button className="text-error font-bold text-sm px-4 py-2 hover:bg-error/5 rounded-full transition-colors">Sign Out of Account</button>
            <div className="h-4 w-px bg-outline-variant/30 hidden md:block"></div>
            <button className="text-on-surface-variant font-medium text-sm px-4 py-2 hover:bg-surface-variant rounded-full transition-colors">Privacy Policy</button>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <button className="flex-1 md:flex-none px-8 py-4 text-on-surface-variant font-bold hover:bg-surface-container transition-colors rounded-full">Reset Changes</button>
            <button className="flex-1 md:flex-none px-12 py-4 bg-gradient-to-r from-primary to-primary-dim text-on-primary font-bold rounded-full shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">Save All Changes</button>
          </div>
        </footer>
      </div>
    </>
  );
}
