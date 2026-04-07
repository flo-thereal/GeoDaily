import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db, users, userSettings, userStats, userContinentMastery } from './drizzle/index';

const JWT_SECRET = process.env.JWT_SECRET || '';
const JWT_EXPIRES_IN = '7d';
const DEV_AUTH_BYPASS = process.env.DEV_AUTH_BYPASS === 'true' && process.env.NODE_ENV !== 'production';
const DEV_USER_ID = '00000000-0000-0000-0000-000000000001';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  level: number;
  title: string | null;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

// Generate JWT token
export function generateToken(user: AuthUser): string {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is required for token generation');
  }

  return jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Verify JWT token
export function verifyToken(token: string): { id: string; email: string } | null {
  if (!JWT_SECRET) {
    return null;
  }

  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string };
  } catch (e) {
    return null;
  }
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Compare password
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Get user by ID
export async function getUserById(id: string): Promise<AuthUser | null> {
  const [user] = await db.select({
    id: users.id,
    email: users.email,
    displayName: users.displayName,
    avatarUrl: users.avatarUrl,
    level: users.level,
    title: users.title,
  }).from(users).where(eq(users.id, id));
  
  if (!user) return null;
  
  return user;
}

// Get user by email
export async function getUserByEmail(email: string): Promise<{ user: AuthUser; passwordHash: string | null } | null> {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  
  if (!user) return null;
  
  return {
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      level: user.level,
      title: user.title,
    },
    passwordHash: user.passwordHash,
  };
}

// Create new user
export async function createUser(
  email: string,
  password: string,
  displayName: string
): Promise<AuthUser> {
  const passwordHash = await hashPassword(password);
  
  const [user] = await db.insert(users)
    .values({ email, passwordHash, displayName })
    .returning({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      level: users.level,
      title: users.title,
    });
  
  // Initialize user stats and settings
  await db.insert(userStats).values({ userId: user.id });
  await db.insert(userSettings).values({ userId: user.id });
  
  // Initialize continent mastery
  const continents = ['Europe', 'Asia', 'Africa', 'Americas', 'Oceania'];
  await db.insert(userContinentMastery).values(
    continents.map(continent => ({ userId: user.id, continent }))
  );
  
  return user;
}

// Authentication middleware
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  // Dev mode bypass - use dev user
  if (DEV_AUTH_BYPASS) {
    getUserById(DEV_USER_ID).then(user => {
      if (user) {
        req.user = user;
      } else {
        // Create a mock dev user if not in DB
        req.user = {
          id: DEV_USER_ID,
          email: 'dev@geodaily.local',
          displayName: 'Dev User',
          avatarUrl: null,
          level: 1,
          title: 'Explorer',
        };
      }
      next();
    }).catch(err => {
      console.error('Error fetching dev user:', err);
      // Still provide mock user on error
      req.user = {
        id: DEV_USER_ID,
        email: 'dev@geodaily.local',
        displayName: 'Dev User',
        avatarUrl: null,
        level: 1,
        title: 'Explorer',
      };
      next();
    });
    return;
  }
  
  // Get token from header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  
  // Get user from database
  getUserById(decoded.id).then(user => {
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = user;
    next();
  }).catch(err => {
    console.error('Error fetching user:', err);
    res.status(500).json({ error: 'Internal server error' });
  });
}

// Optional auth middleware - doesn't fail if no token
export function optionalAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  // Dev mode bypass
  if (DEV_AUTH_BYPASS) {
    getUserById(DEV_USER_ID).then(user => {
      req.user = user || undefined;
      next();
    }).catch(() => next());
    return;
  }
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  
  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return next();
  }
  
  getUserById(decoded.id).then(user => {
    req.user = user || undefined;
    next();
  }).catch(() => next());
}
