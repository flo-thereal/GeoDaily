import { Router, Response } from 'express';
import { eq, ilike, or, sql, asc, count } from 'drizzle-orm';
import { AuthRequest } from '../auth';
import { db, countries } from '../drizzle/index';

const router = Router();

// Get regions - must be before /:code to avoid matching "meta"
router.get('/meta/regions', async (req: AuthRequest, res: Response) => {
  try {
    const regions = await db
      .select({
        region: countries.region,
        count: count(),
      })
      .from(countries)
      .groupBy(countries.region)
      .orderBy(asc(countries.region));

    res.json(regions);
  } catch (error) {
    console.error('Failed to get regions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all countries
router.get('/', async (req: AuthRequest, res: Response) => {
  const { region, search, limit, offset } = req.query;

  try {
    let query = db.select().from(countries).$dynamic();

    // Build where conditions
    const conditions = [];
    if (region) {
      conditions.push(eq(countries.region, region as string));
    }
    if (search) {
      conditions.push(
        or(
          ilike(countries.name, `%${search}%`),
          ilike(countries.capital, `%${search}%`)
        )!
      );
    }

    if (conditions.length > 0) {
      query = query.where(conditions.length === 1 ? conditions[0] : sql`${conditions[0]} AND ${conditions[1]}`);
    }

    query = query.orderBy(asc(countries.name));

    if (limit) {
      query = query.limit(parseInt(limit as string));
    }
    if (offset) {
      query = query.offset(parseInt(offset as string));
    }

    const result = await query;

    res.json(result.map(c => ({
      code: c.code,
      name: c.name,
      capital: c.capital,
      region: c.region,
      subregion: c.subregion,
      population: c.population,
      areaKm2: c.areaKm2,
      currency: c.currency,
      languages: c.languages,
      borders: c.borders,
      coordinates: c.coordinates,
      flagEmoji: c.flagEmoji,
      description: c.description,
      funFacts: c.funFacts,
    })));
  } catch (error) {
    console.error('Failed to get countries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single country by code
router.get('/:code', async (req: AuthRequest, res: Response) => {
  const { code } = req.params;

  try {
    const [country] = await db.select()
      .from(countries)
      .where(eq(countries.code, code.toUpperCase()));

    if (!country) {
      return res.status(404).json({ error: 'Country not found' });
    }

    res.json({
      code: country.code,
      name: country.name,
      capital: country.capital,
      region: country.region,
      subregion: country.subregion,
      population: country.population,
      areaKm2: country.areaKm2,
      currency: country.currency,
      languages: country.languages,
      borders: country.borders,
      coordinates: country.coordinates,
      flagEmoji: country.flagEmoji,
      description: country.description,
      funFacts: country.funFacts,
    });
  } catch (error) {
    console.error('Failed to get country:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
