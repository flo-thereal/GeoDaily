import { describe, expect, it } from 'vitest';
import { findCountry, findCountryByName } from '../../src/lib/countries';

describe('findCountry', () => {
  it('looks up by ISO code case-insensitively', () => {
    expect(findCountry('fr')?.name).toBe('France');
    expect(findCountry('FR')?.name).toBe('France');
  });
});

describe('findCountryByName', () => {
  it('looks up by exact country name', () => {
    expect(findCountryByName('France')?.code).toBe('FR');
    expect(findCountryByName('Sri Lanka')?.code).toBe('LK');
  });

  it('returns undefined for unknown names', () => {
    expect(findCountryByName('Atlantis')).toBeUndefined();
  });
});
