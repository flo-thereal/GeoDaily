export function Explore() {
  return (
    <>
      <header className="w-full sticky top-0 z-50 bg-blue-50/80 dark:bg-slate-900/80 backdrop-blur-xl flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative max-w-md w-full">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input className="w-full bg-surface-container-low border-none rounded-DEFAULT pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all" placeholder="Search countries, capitals, or regions..." type="text"/>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50 rounded-full transition-colors active:scale-90">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden active:scale-90 transition-transform cursor-pointer">
            <img alt="User profile settings" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB-E1sZWYqo5-GiTmbpSKYwpApNBE-WAUC8r1VLqf_nRczcWHUO7mequM5RoN_mFhpeeHkWF7dc1z714Cqf_b9c-mZiig3GqM6UdLXCj9_7S-thhnoKE9GNVL3QdfrazR_Sgrz1g9-p6xolYTyHZ1skTJ_IySmgONp00-A2GRJ099V3KeSg5P2bNgTgQmCmF_tvORmnLAs5hB9UOGYKILMqNLZlAOlQqebAszY3IZ0lTjKVBEVQUiJwtZQaLq4SwM1VoOBgMZCkngu9"/>
          </div>
        </div>
      </header>

      <div className="p-6 md:p-10 space-y-10">
        {/* Hero / Title Section */}
        <section className="relative">
          <div className="max-w-3xl">
            <h2 className="text-5xl md:text-6xl font-headline font-extrabold tracking-tight text-on-surface mb-4">
              The World <span className="text-primary italic">Encyclopedia</span>
            </h2>
            <p className="text-lg text-on-surface-variant max-w-xl leading-relaxed">
              Traverse the globe through our curated cartographic library. Discover cultures, borders, and the stories that define our planet.
            </p>
          </div>
        </section>

        {/* Filters Bar */}
        <section className="flex flex-wrap items-center gap-3">
          <button className="px-6 py-2 bg-tertiary-container text-on-tertiary-container rounded-full font-headline text-sm font-bold shadow-sm transition-all active:scale-95">All Regions</button>
          <button className="px-6 py-2 bg-surface-container-high text-on-surface-variant rounded-full font-headline text-sm font-semibold hover:bg-white transition-all active:scale-95">Europe</button>
          <button className="px-6 py-2 bg-surface-container-high text-on-surface-variant rounded-full font-headline text-sm font-semibold hover:bg-white transition-all active:scale-95">Asia</button>
          <button className="px-6 py-2 bg-surface-container-high text-on-surface-variant rounded-full font-headline text-sm font-semibold hover:bg-white transition-all active:scale-95">Africa</button>
          <button className="px-6 py-2 bg-surface-container-high text-on-surface-variant rounded-full font-headline text-sm font-semibold hover:bg-white transition-all active:scale-95">Americas</button>
          <button className="px-6 py-2 bg-surface-container-high text-on-surface-variant rounded-full font-headline text-sm font-semibold hover:bg-white transition-all active:scale-95">Oceania</button>
          <div className="ml-auto flex items-center gap-2 text-outline">
            <span className="material-symbols-outlined text-sm">sort</span>
            <span className="font-label text-xs font-bold uppercase tracking-widest">Sort by: A-Z</span>
          </div>
        </section>

        {/* Main Grid & Detail Sidebar Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Countries Grid */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Country Card 1 (Active/Selected) */}
            <div className="group bg-surface-container-lowest p-4 rounded-lg flex flex-col items-center text-center transition-all hover:scale-[1.02] cursor-pointer ring-2 ring-primary/20">
              <div className="w-full aspect-[3/2] rounded-DEFAULT overflow-hidden mb-4 bg-surface-container shadow-sm">
                <img alt="Japan" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDhSbjrHcFbmHV7ucq5L1zcSG8u8Xhj76MNiElVgFD4L6_GEatd8Kuy-2AT_MFon03xRsT-BuMQ_REqJBqgVBWrIcsEq5FNSrGDahu85YRtyf0mFwvg_gL6d3LofltdNwSrX6o_Ub3XpMKAnDfzrACrnnaoK_7fWR2_pbmRmRXaiMlhS4wRYr7AcgWZYUPe7ME8cQCzW1iAvWCO4pOKyKkthFehu5klliaZrUFpNXx1LH4LLLW9aC4w0hnTYJvgab1x3FEaO76dxoPw"/>
              </div>
              <h3 className="font-headline font-bold text-on-surface">Japan</h3>
              <p className="text-xs text-outline font-medium mt-1">East Asia</p>
            </div>
            
            {/* Country Card 2 */}
            <div className="group bg-surface-container-lowest p-4 rounded-lg flex flex-col items-center text-center transition-all hover:scale-[1.02] cursor-pointer">
              <div className="w-full aspect-[3/2] rounded-DEFAULT overflow-hidden mb-4 bg-surface-container shadow-sm">
                <img alt="India" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD1ZrhBI2-rnx2ixAM26C5Bta5U8WmlVmtNbBv58kXyZ9XHE3h1ojjIUqiP__UTjPiEt84rPdgzlaxnFiz8jwEJXSWrjUjWZYvb5lNLVL7s-XhAIBrgBwiBTQH1BdiIXAQ13TDVNePg-bzua0RyhqbEDyzuw_0xyOW2RklWDA2Q0Fe9437Hi5k02oOkAQlJrs05nzUTjICZ3Yh_L_93NXBWqEQcCKjDk7IFxNCoZ1ei47oHPLxwMRJVFvr0O-9OBv_dKhdsbP0eTdss"/>
              </div>
              <h3 className="font-headline font-bold text-on-surface">India</h3>
              <p className="text-xs text-outline font-medium mt-1">South Asia</p>
            </div>
            
            {/* Country Card 3 */}
            <div className="group bg-surface-container-lowest p-4 rounded-lg flex flex-col items-center text-center transition-all hover:scale-[1.02] cursor-pointer">
              <div className="w-full aspect-[3/2] rounded-DEFAULT overflow-hidden mb-4 bg-surface-container shadow-sm">
                <img alt="Russia" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDAQYnpvigqngA-HJS0BVcdRSmiv6jQvC8wl-a02hTbpyGnLqNuBG-8NdyB_4Y5eISFh4epR9goQa3GozbSiR1f6UNCVixUWVEGbvVQVOKP_OUHREJmh1LiHMKIAG2dlqO3LzNBUPvulQ2hbp9auQFpCaQ37F1ekwaVBYAKhueUDkPmXVUmRWKykzDFxhnFE7QqhHLYZzdjCHWg7KsDKUUFEBkOoQpCzPkYN6_0pU_ow-6Xzv-5q8FlOLEY5H4czQoFUXmT_Rn7Aqjh"/>
              </div>
              <h3 className="font-headline font-bold text-on-surface">Russia</h3>
              <p className="text-xs text-outline font-medium mt-1">Europe/Asia</p>
            </div>
            
            {/* Country Card 4 */}
            <div className="group bg-surface-container-lowest p-4 rounded-lg flex flex-col items-center text-center transition-all hover:scale-[1.02] cursor-pointer">
              <div className="w-full aspect-[3/2] rounded-DEFAULT overflow-hidden mb-4 bg-surface-container shadow-sm">
                <img alt="Portugal" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDdLqb0mvdCyjG0UT8yJ1AZA956b7g3l07bgvediNLAckVm69xkcfvy6AhwBchi5BiMxWv71EFvrmu146FTS1pr4LkfG2gg-5O_gRZFLKltg3LhtN-505PzfCHSoe8OySgZRiEv3IzAzk3y2CztpAsvgGIlkAYqrBpwaZUtoRaahYlXbLlQp43sDy9t_o-Y6mRabvHIuEjl7U4BzQzRvN850SBVlZpyyuNeTs7MEJuOTIPNP5xKRC0F6pozpoSt_Hq94fBiZatFXWb7"/>
              </div>
              <h3 className="font-headline font-bold text-on-surface">Portugal</h3>
              <p className="text-xs text-outline font-medium mt-1">Southern Europe</p>
            </div>
            
            {/* Country Card 5 */}
            <div className="group bg-surface-container-lowest p-4 rounded-lg flex flex-col items-center text-center transition-all hover:scale-[1.02] cursor-pointer">
              <div className="w-full aspect-[3/2] rounded-DEFAULT overflow-hidden mb-4 bg-surface-container shadow-sm">
                <img alt="Kenya" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBM28R1lgdZdcVdiLej2af5ojjpMaN1GO6wupodeQO4ZeoDHO9vr7zYemw0NAUaAQStOllwYDzfN15-mDLxNKwQnHusr4HtgJshnx5vwY26-xDvSxy-XcPiu8hImDsRie-qEe1lZBUvg0bDmCqgUfcdkBAEOq7igIkEUrM8bjvY0LN8r9Ef2TgB8Qw2NLYiXLapEC17NX6pcQ1ot6kSeVRGRY8xh-lrOm_eyYfB27lYHojDRRoXlcpkW_oCkf8s-nM9QBUBqw8bVnj5"/>
              </div>
              <h3 className="font-headline font-bold text-on-surface">Kenya</h3>
              <p className="text-xs text-outline font-medium mt-1">East Africa</p>
            </div>
            
            {/* Country Card 6 */}
            <div className="group bg-surface-container-lowest p-4 rounded-lg flex flex-col items-center text-center transition-all hover:scale-[1.02] cursor-pointer">
              <div className="w-full aspect-[3/2] rounded-DEFAULT overflow-hidden mb-4 bg-surface-container shadow-sm">
                <img alt="Australia" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC5zl92e4YabkRoaFBQXxsrzEORhfvRkr-IrkmjpY0C9nNmvdAvLfSWaH0dI8z_ma5H45XvNsJVOyV_z66K0k21s3QpqDnk7HLBKtJiOFE2yuJi2cH7bIEMOHNOxR61tY5DPID8Xlshj3akFnT5vldlvCie45azrW8HUeW81rI15ZkugHbm6VoGizndmdpkJRYkgc8ijjL9RHJmjRYrWRK9T6aLvW_uYJfKpNTHs2WdsUARieXbQ8veya_9luX5s_ZjhNeiyG5YRibh"/>
              </div>
              <h3 className="font-headline font-bold text-on-surface">Australia</h3>
              <p className="text-xs text-outline font-medium mt-1">Oceania</p>
            </div>
            
            {/* Country Card 7 */}
            <div className="group bg-surface-container-lowest p-4 rounded-lg flex flex-col items-center text-center transition-all hover:scale-[1.02] cursor-pointer">
              <div className="w-full aspect-[3/2] rounded-DEFAULT overflow-hidden mb-4 bg-surface-container shadow-sm">
                <img alt="Brazil" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBsHPytCS6pAc2_P_EIbKwwwJ1578u0Gc8TI7F07Dpj1Uo0-OePXuFP0deRzkeLkKgs4uRA-zyMwBzG9ESO2bAbfq7catMw0KNGCjeAHCJJsrwZYoFJL0-l3JuIVDWlK1P7YGkFpMCwzlFWvMcCsLfTq32dJxW8y-Tyla3xEkD1mJpJ16qlQqbXfUsm1gTS0XrktrG0w6O4tzUfFpPpejgj4ElflujM5E-ahfk0WCyomApWgFR9x_4C3oBB-Kwv52AQllAD15QyMpIc"/>
              </div>
              <h3 className="font-headline font-bold text-on-surface">Brazil</h3>
              <p className="text-xs text-outline font-medium mt-1">South America</p>
            </div>
            
            {/* Country Card 8 */}
            <div className="group bg-surface-container-lowest p-4 rounded-lg flex flex-col items-center text-center transition-all hover:scale-[1.02] cursor-pointer">
              <div className="w-full aspect-[3/2] rounded-DEFAULT overflow-hidden mb-4 bg-surface-container shadow-sm">
                <img alt="Canada" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB7yisn7qArU4t-2myuWLkMuSyvTrKfgEIw4a0IjYJzf-9MM7tSp7Vn9op_GGHuLe5X8o8nEwnKrtGMmrvTf2wZEC7A0XxWjzJPs9HQjPzxgIpD7Eq3p-BFY7nbBonYQ0z9_jB1vkYbXtOnq6PiaXLqX6R_iJ_5eeuIoRmGWrgTHLno-dLSaskAMW2MpTqSaT84DrUpnL00ckuPu9Y5m8ydDZ70nxa3JJ2tCjJkDc6qMQJ8eNidzH8xvrGyMM7SS1lTJjGoMnZyUs7F"/>
              </div>
              <h3 className="font-headline font-bold text-on-surface">Canada</h3>
              <p className="text-xs text-outline font-medium mt-1">North America</p>
            </div>
          </div>

          {/* Fact Sidebar (The Modern Library Panel) */}
          <aside className="lg:col-span-4">
            <div className="sticky top-28 bg-surface-container-low rounded-lg overflow-hidden flex flex-col shadow-xl shadow-on-surface/5 border border-white/50">
              <div className="h-48 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low to-transparent z-10"></div>
                <img alt="Japan Map" className="w-full h-full object-cover scale-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAncl3TSXKCwA2s8EJ2TOP9dFJ1-HoVGM_Lg70U3b_xBYXIAElOhbG-DFZAu1DU6bQcuRzJADK4LP1lENAKOc7UFwNlhmiZ8taeZz5Sew2FQx2U96-WGV7lab-4v5SvOh1LLr9cWUO9nQVkReEh8a_gKKW6DN-2GUhi3Ny_3cZDKDXdgYVIBI4ncdtpgAvNlBEtYihHtomdxF3qJ9CDHqFh0DEHLwMq60QTBMe24wmoDJ-yFwApwOWcSTHJvtDiMlnlJD7lTpJZAl1F"/>
                <div className="absolute bottom-4 left-6 z-20">
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-label text-[10px] font-black uppercase tracking-tighter mb-2 inline-block">Active Selection</span>
                  <h4 className="text-3xl font-headline font-black text-on-surface">Japan</h4>
                </div>
              </div>
              <div className="p-8 space-y-8">
                {/* Quick Facts */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/40 p-4 rounded-DEFAULT">
                    <p className="text-[10px] font-label font-bold text-outline uppercase tracking-widest mb-1">Capital</p>
                    <p className="font-headline font-bold text-on-surface">Tokyo</p>
                  </div>
                  <div className="bg-white/40 p-4 rounded-DEFAULT">
                    <p className="text-[10px] font-label font-bold text-outline uppercase tracking-widest mb-1">Region</p>
                    <p className="font-headline font-bold text-on-surface">East Asia</p>
                  </div>
                  <div className="bg-white/40 p-4 rounded-DEFAULT">
                    <p className="text-[10px] font-label font-bold text-outline uppercase tracking-widest mb-1">Population</p>
                    <p className="font-headline font-bold text-on-surface">125.7M</p>
                  </div>
                  <div className="bg-white/40 p-4 rounded-DEFAULT">
                    <p className="text-[10px] font-label font-bold text-outline uppercase tracking-widest mb-1">Currency</p>
                    <p className="font-headline font-bold text-on-surface">JPY (¥)</p>
                  </div>
                </div>

                {/* Borders */}
                <div>
                  <p className="text-[10px] font-label font-bold text-outline uppercase tracking-widest mb-3">Bordering Maritime Zones</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-surface-container text-on-surface-variant rounded-full text-xs font-semibold">Sea of Japan</span>
                    <span className="px-3 py-1 bg-surface-container text-on-surface-variant rounded-full text-xs font-semibold">East China Sea</span>
                    <span className="px-3 py-1 bg-surface-container text-on-surface-variant rounded-full text-xs font-semibold">Pacific Ocean</span>
                  </div>
                </div>

                {/* Context Summary */}
                <div className="bg-primary/5 p-6 rounded-DEFAULT border-l-4 border-primary">
                  <p className="text-sm text-on-surface leading-relaxed italic">
                    "An archipelago of 6,852 islands, Japan combines ancient traditions with ultra-modern technology. Its geography is 73% mountainous, featuring the iconic Mount Fuji."
                  </p>
                </div>

                <button className="w-full py-4 bg-secondary text-on-secondary rounded-full font-headline font-bold text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-lg">book</span>
                  Full Entry
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
