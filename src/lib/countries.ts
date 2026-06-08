import countriesData from '../data/countries.json';

export interface Country {
  code: string;
  name: string;
  capital: string;
  region: string;
  subregion?: string;
  population: number;
  areaKm2: number;
  currency: {
    code: string;
    name: string;
    symbol: string;
  };
  languages: string[];
  borders: string[];
  coordinates: {
    lat: number;
    lng: number;
  };
  capitalCoordinates?: {
    lat: number;
    lng: number;
  };
  flagEmoji: string;
  description?: string;
  funFacts?: string[];
}

export const COUNTRIES = countriesData as Country[];

// Profile/continent-mastery groups the two American regions under "Americas",
// matching the canonical continents used across the UI.
export type Continent = 'Europe' | 'Asia' | 'Africa' | 'Americas' | 'Oceania';

export function regionToContinent(region: string): Continent {
  if (region === 'North America' || region === 'South America') return 'Americas';
  return region as Continent;
}

const byCode = new Map(COUNTRIES.map((c) => [c.code.toUpperCase(), c]));

export function findCountry(code: string): Country | undefined {
  return byCode.get(code.trim().toUpperCase());
}
