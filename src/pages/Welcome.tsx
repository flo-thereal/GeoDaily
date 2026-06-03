import { Link } from 'react-router-dom';
import { markAppVisited } from '../components/FirstVisitRedirect';

export function Welcome() {
  return (
    <div className="bg-surface font-body text-on-surface selection:bg-primary-container selection:text-on-primary-container overflow-x-hidden min-h-screen flex flex-col items-center justify-center relative p-6">
      {/* Background Asymmetry / Decorative Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-secondary-fixed-dim opacity-20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-5%] left-[-5%] w-[400px] h-[400px] bg-primary-fixed opacity-30 rounded-full blur-[80px] pointer-events-none"></div>
      
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        {/* Illustration Column (Bento Style) */}
        <div className="lg:col-span-7 order-2 lg:order-1">
          <div className="relative grid grid-cols-2 gap-4">
            {/* Main Map Card */}
            <div className="col-span-2 bg-surface-container-lowest rounded-lg p-4 shadow-sm transform -rotate-1 hover:rotate-0 transition-transform duration-500">
              <img alt="World Map" className="w-full h-80 object-cover rounded-DEFAULT" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC_S9sEHYzwIXgIr2jJo1CuX1mfdNQqf4Ev9SDFhHv40c6V-fw6UOO6b2ZLEFEB25dWulymDhW3iLOb9kFVtDk9VP0hq5_3siVH5ZjW-dw9Ha2eOdouX1D5_tzfqdIYm8JrQXu9AVV6Y6Apz4c43YHhg8dMVpAormLL-MK8yghbyJrHbB6mAq9XtmVgm7Pe0t6rJe7Nrbr3tmI-nlYnmANlSVwNS-R7GRTa9c2qOVN7ldGrXeSfbD2rtLAe1M3ldFQcyubC_-COx3uL"/>
              <div className="mt-4 flex items-center justify-between">
                <span className="font-headline font-bold text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>explore</span>
                  Daily Expedition
                </span>
                <span className="text-xs font-label uppercase tracking-widest text-outline">Cartographer Rank 01</span>
              </div>
            </div>
            
            {/* Mini Interaction Card 1: Flags */}
            <div className="bg-surface-container-high rounded-lg p-6 flex flex-col items-center justify-center transform rotate-2">
              <div className="flex space-x-[-10px] mb-4">
                <div className="w-10 h-10 rounded-full border-2 border-surface bg-white flex items-center justify-center shadow-sm">🇯🇵</div>
                <div className="w-10 h-10 rounded-full border-2 border-surface bg-white flex items-center justify-center shadow-sm">🇧🇷</div>
                <div className="w-10 h-10 rounded-full border-2 border-surface bg-white flex items-center justify-center shadow-sm">🇳🇴</div>
              </div>
              <p className="font-headline font-bold text-on-surface-variant text-center text-sm leading-tight">Identify 195 Flags</p>
            </div>
            
            {/* Mini Interaction Card 2: Explorer Tools */}
            <div className="bg-secondary-container rounded-lg p-6 flex items-center gap-4 transform -rotate-2">
              <div className="p-3 bg-surface-container-lowest rounded-full text-secondary">
                <span className="material-symbols-outlined">navigation</span>
              </div>
              <div>
                <p className="font-headline font-bold text-on-secondary-container text-sm">Compass Ready</p>
                <p className="text-xs text-on-secondary-container/70">Navigation tools unlocked</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Column */}
        <div className="lg:col-span-5 flex flex-col items-start space-y-8 order-1 lg:order-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-container text-on-primary-container rounded-full">
            <span className="material-symbols-outlined text-[18px]">public</span>
            <span className="text-xs font-label font-bold uppercase tracking-widest">Global Discovery Platform</span>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-6xl lg:text-7xl font-headline font-extrabold text-on-surface leading-[1.1] tracking-tighter">
              Welcome to <span className="text-primary italic">GeoDaily</span>
            </h1>
            <p className="text-xl text-on-surface-variant leading-relaxed max-w-md font-body">
              Master the world in 5 minutes a day. Learn flags, capitals, and borders through daily mini-games.
            </p>
          </div>

          {/* Bento Action Section */}
          <div className="w-full flex flex-col space-y-4">
            <Link
              to="/"
              onClick={() => markAppVisited()}
              className="bg-gradient-to-br from-primary to-primary-dim text-on-primary px-10 py-5 rounded-full font-headline font-bold text-lg flex items-center justify-center gap-3 w-full shadow-lg shadow-primary/20 scale-100 hover:scale-[1.02] active:scale-95 transition-all group"
            >
              Start My Journey
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </Link>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-surface-container-low p-4 rounded-lg flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-bold text-primary">5m</span>
                <span className="text-[10px] font-label uppercase text-outline">Micro-Learning</span>
              </div>
              <div className="bg-surface-container-low p-4 rounded-lg flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-bold text-secondary">150+</span>
                <span className="text-[10px] font-label uppercase text-outline">Countries</span>
              </div>
              <div className="bg-surface-container-low p-4 rounded-lg flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-bold text-tertiary">10k+</span>
                <span className="text-[10px] font-label uppercase text-outline">Explorers</span>
              </div>
            </div>
          </div>

          {/* Footer Tonal Hint */}
          <div className="pt-8 border-t border-outline-variant/20 w-full">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                <img alt="Explorer" className="w-8 h-8 rounded-full border-2 border-surface object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDiAGqFeJH6qUxsLXpJJSVGtopuBKeGE6krZL_f2p2wxGgrFhWWXglAAsMyyOOIlIvHJmFrDVB9eMX474jiFK-cslY15tUOyEgawnLmgKXCnuOWr_WDGmkCow4vc71Ji_VGbaTJgDd1QiYH0KXVnTiAOQ4YQyxIU1vryZLFYKFhI79bjCmtpU74hnsx-f7ZQ2_XYwHFnOUp5VLQ3zZP8jXuJzm8os1qrRG7EIdx8fuy2Kt5s5ZXcRzqr_XjBDhoN6qu8oxpE5hq35FB"/>
                <img alt="Explorer" className="w-8 h-8 rounded-full border-2 border-surface object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBrkIWDrabg70BteZsebEoei-lQU0LBqVnjqT09dJKKAk65ia0J2JM77IimKJxFhS9OtHGkzN_XhGWNQveAeStShZhRxXh4eStQ6RHkzVnmyPiN-jvlawmDvPs2e-_QQjmHxSZDQ5GFJNL84tzt_zhp_TfgHR-1NytD_aBZUIVkiw6vBlkb4rvEPpxjjWuhPjzwdYq-65wKtc-9ttNaJrCcZUDnAI24Z1j-GzFMfu1b6OgX7B6UvQCBII2kbWiR1FpgQc7oERh3BpEW"/>
                <img alt="Explorer" className="w-8 h-8 rounded-full border-2 border-surface object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAUJwJqg0XybsXODz_ppZSoRo7xV4x6IF4f_ngWwYEKjKbsu9yui-PiHuvGsT8L-A-vIbowufF46NZflSIx-nN4Ql5G2hSz6sKPwIaNCJR10KWIrcPc5QZPax-oDqj44g_2hVpMRLmW03eadQ1CRJq01L1n3JDfzGEjHmMjXVKiKmmEXiWqAWMOFHE10zRWNU7azhDSJIfe_yKk-l-jl0LR9jzqFQvDljsMyHGN_mDIILAUlE4WuKPV4S8YzAdeB7XubT5hnyw1zgGp"/>
              </div>
              <p className="text-sm text-outline font-medium">Join over 12,000 active cartographers this week</p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Decorative Orb */}
      <div className="absolute bottom-10 right-10 w-24 h-24 bg-tertiary-container/20 rounded-full backdrop-blur-xl border border-tertiary/10 flex items-center justify-center shadow-2xl">
        <span className="material-symbols-outlined text-tertiary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
      </div>

      {/* Contextual Nav Layer (Minimalist for Onboarding) */}
      <nav className="fixed top-0 left-0 w-full z-50 px-8 py-6 flex justify-between items-center bg-surface/30 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white font-headline font-black text-xl">G</div>
          <span className="font-headline font-extrabold text-xl tracking-tight text-on-surface">GeoDaily</span>
        </div>
        <Link
          to="/"
          onClick={() => markAppVisited()}
          className="bg-surface-container-highest px-5 py-2.5 rounded-full text-sm font-bold text-on-surface hover:bg-surface-container-high transition-colors"
        >
          Start
        </Link>
      </nav>
    </div>
  );
}
