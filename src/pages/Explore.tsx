import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getCountries, getRegions, Country } from '../services/api';
import { findCountry } from '../lib/countries';

function formatPopulation(pop: number): string {
  if (pop >= 1_000_000_000) return `${(pop / 1_000_000_000).toFixed(1)}B`;
  if (pop >= 1_000_000) return `${(pop / 1_000_000).toFixed(1)}M`;
  if (pop >= 1_000) return `${(pop / 1_000).toFixed(1)}K`;
  return pop.toString();
}

function formatArea(area: number): string {
  return area.toLocaleString() + ' km²';
}

export function Explore() {
  const [searchParams] = useSearchParams();
  const detailRef = useRef<HTMLDivElement>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [regions, setRegions] = useState<{ region: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [countriesData, regionsData] = await Promise.all([
          getCountries(),
          getRegions(),
        ]);
        setCountries(countriesData);
        setRegions(regionsData);
        const codeParam = searchParams.get('country')?.toUpperCase();
        if (codeParam) {
          const match = countriesData.find((c) => c.code === codeParam) ?? findCountry(codeParam);
          setSelectedCountry(match ?? countriesData[0] ?? null);
        } else if (countriesData.length > 0) {
          setSelectedCountry(countriesData[0]);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load countries. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [searchParams]);

  const filteredCountries = useMemo(() => {
    let result = countries;

    if (selectedRegion) {
      result = result.filter((c) => c.region === selectedRegion);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.capital?.toLowerCase().includes(query) ||
          c.region?.toLowerCase().includes(query)
      );
    }

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [countries, selectedRegion, searchQuery]);

  return (
    <>
      <header className="w-full sticky top-0 z-50 bg-blue-50/80 dark:bg-slate-900/80 backdrop-blur-xl flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative max-w-md w-full">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input
              className="w-full bg-surface-container-low border-none rounded-DEFAULT pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all"
              placeholder="Search countries, capitals, or regions..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-4" />
      </header>

      <div className="p-6 md:p-10 space-y-10">
        {/* Hero / Title Section */}
        <section className="relative">
          <div className="max-w-3xl">
            <h2 className="text-5xl md:text-6xl font-headline font-extrabold tracking-tight text-on-surface mb-4">
              Country <span className="text-primary italic">Atlas</span>
            </h2>
            <p className="text-lg text-on-surface-variant max-w-xl leading-relaxed">
              Look up flags, capitals, and facts after your daily challenge — especially for countries you missed.
            </p>
          </div>
        </section>

        {/* Filters Bar */}
        <section className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setSelectedRegion(null)}
            className={`px-6 py-2 rounded-full font-headline text-sm font-bold shadow-sm transition-all active:scale-95 ${
              selectedRegion === null
                ? 'bg-tertiary-container text-on-tertiary-container'
                : 'bg-surface-container-high text-on-surface-variant hover:bg-white'
            }`}
          >
            All Regions
          </button>
          {regions.map((r) => (
            <button
              key={r.region}
              onClick={() => setSelectedRegion(r.region)}
              className={`px-6 py-2 rounded-full font-headline text-sm font-semibold transition-all active:scale-95 ${
                selectedRegion === r.region
                  ? 'bg-tertiary-container text-on-tertiary-container font-bold shadow-sm'
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-white'
              }`}
            >
              {r.region} ({r.count})
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2 text-outline">
            <span className="material-symbols-outlined text-sm">sort</span>
            <span className="font-label text-xs font-bold uppercase tracking-widest">Sort by: A-Z</span>
          </div>
        </section>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
              <p className="text-on-surface-variant font-medium">Loading countries...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4 text-center max-w-md">
              <span className="material-symbols-outlined text-5xl text-error">error</span>
              <p className="text-on-surface font-headline font-bold text-lg">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-primary text-on-primary rounded-full font-headline text-sm font-bold transition-all active:scale-95"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Main Grid & Detail Sidebar Layout */}
        {!loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Countries Grid */}
            <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCountries.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                  <span className="material-symbols-outlined text-4xl text-outline mb-4">search_off</span>
                  <p className="text-on-surface-variant font-medium">No countries found matching your criteria.</p>
                </div>
              ) : (
                filteredCountries.map((country) => (
                  <div
                    key={country.code}
                    onClick={() => setSelectedCountry(country)}
                    className={`group bg-surface-container-lowest p-4 rounded-lg flex flex-col items-center text-center transition-all hover:scale-[1.02] cursor-pointer ${
                      selectedCountry?.code === country.code ? 'ring-2 ring-primary/20' : ''
                    }`}
                  >
                    <div className="w-full aspect-[3/2] rounded-DEFAULT overflow-hidden mb-4 bg-surface-container shadow-sm flex items-center justify-center">
                      <span className="text-6xl group-hover:scale-110 transition-transform duration-500">
                        {country.flagEmoji}
                      </span>
                    </div>
                    <h3 className="font-headline font-bold text-on-surface">{country.name}</h3>
                    <p className="text-xs text-outline font-medium mt-1">{country.subregion || country.region}</p>
                  </div>
                ))
              )}
            </div>

            {/* Fact Sidebar (The Modern Library Panel) */}
            <aside className="lg:col-span-4">
              {selectedCountry ? (
                <div ref={detailRef} className="sticky top-28 bg-surface-container-low rounded-lg overflow-hidden flex flex-col shadow-xl shadow-on-surface/5 border border-white/50">
                  <div className="h-48 relative overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10">
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low to-transparent z-10"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[120px]">{selectedCountry.flagEmoji}</span>
                    </div>
                    <div className="absolute bottom-4 left-6 z-20">
                      <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-label text-[10px] font-black uppercase tracking-tighter mb-2 inline-block">Active Selection</span>
                      <h4 className="text-3xl font-headline font-black text-on-surface">{selectedCountry.name}</h4>
                    </div>
                  </div>
                  <div className="p-8 space-y-8">
                    {/* Quick Facts */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/40 p-4 rounded-DEFAULT">
                        <p className="text-[10px] font-label font-bold text-outline uppercase tracking-widest mb-1">Capital</p>
                        <p className="font-headline font-bold text-on-surface">{selectedCountry.capital || 'N/A'}</p>
                      </div>
                      <div className="bg-white/40 p-4 rounded-DEFAULT">
                        <p className="text-[10px] font-label font-bold text-outline uppercase tracking-widest mb-1">Region</p>
                        <p className="font-headline font-bold text-on-surface">{selectedCountry.subregion || selectedCountry.region}</p>
                      </div>
                      <div className="bg-white/40 p-4 rounded-DEFAULT">
                        <p className="text-[10px] font-label font-bold text-outline uppercase tracking-widest mb-1">Population</p>
                        <p className="font-headline font-bold text-on-surface">{formatPopulation(selectedCountry.population)}</p>
                      </div>
                      <div className="bg-white/40 p-4 rounded-DEFAULT">
                        <p className="text-[10px] font-label font-bold text-outline uppercase tracking-widest mb-1">Area</p>
                        <p className="font-headline font-bold text-on-surface">{formatArea(selectedCountry.areaKm2)}</p>
                      </div>
                    </div>

                    {/* Languages */}
                    {selectedCountry.languages && selectedCountry.languages.length > 0 && (
                      <div>
                        <p className="text-[10px] font-label font-bold text-outline uppercase tracking-widest mb-3">Languages</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedCountry.languages.map((lang) => (
                            <span key={lang} className="px-3 py-1 bg-surface-container text-on-surface-variant rounded-full text-xs font-semibold">
                              {lang}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Borders */}
                    {selectedCountry.borders && selectedCountry.borders.length > 0 && (
                      <div>
                        <p className="text-[10px] font-label font-bold text-outline uppercase tracking-widest mb-3">Bordering Countries</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedCountry.borders.map((border) => (
                            <button
                              key={border}
                              type="button"
                              onClick={() => {
                                const neighbor = countries.find((c) => c.code === border) ?? findCountry(border);
                                if (neighbor) setSelectedCountry(neighbor);
                              }}
                              className="px-3 py-1 bg-surface-container text-on-surface-variant rounded-full text-xs font-semibold hover:bg-primary/10 hover:text-primary transition-colors"
                            >
                              {findCountry(border)?.name || border}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    {selectedCountry.description && (
                      <div className="bg-primary/5 p-6 rounded-DEFAULT border-l-4 border-primary">
                        <p className="text-sm text-on-surface leading-relaxed italic">
                          "{selectedCountry.description}"
                        </p>
                      </div>
                    )}

                    {selectedCountry.funFacts && selectedCountry.funFacts.length > 0 && (
                      <div>
                        <p className="text-[10px] font-label font-bold text-outline uppercase tracking-widest mb-3">Fun Facts</p>
                        <ul className="space-y-2 text-sm text-on-surface-variant">
                          {selectedCountry.funFacts.map((fact) => (
                            <li key={fact} className="flex gap-2">
                              <span className="text-primary">•</span>
                              {fact}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  </div>
                </div>
              ) : (
                <div className="sticky top-28 bg-surface-container-low rounded-lg overflow-hidden flex flex-col shadow-xl shadow-on-surface/5 border border-white/50 p-8">
                  <div className="flex flex-col items-center justify-center text-center py-12">
                    <span className="material-symbols-outlined text-5xl text-outline mb-4">public</span>
                    <p className="text-on-surface-variant font-medium">Select a country to view details</p>
                  </div>
                </div>
              )}
            </aside>
          </div>
        )}
      </div>
    </>
  );
}
