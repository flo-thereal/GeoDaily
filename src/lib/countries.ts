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

const byCode = new Map(COUNTRIES.map((c) => [c.code.toUpperCase(), c]));
const byName = new Map(COUNTRIES.map((c) => [c.name, c]));

export function findCountry(code: string): Country | undefined {
  return byCode.get(code.trim().toUpperCase());
}

export function findCountryByName(name: string): Country | undefined {
  return byName.get(name.trim());
}
