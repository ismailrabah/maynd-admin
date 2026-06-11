// Maynd.ma Admin API - Authentication Middleware
import { Context, Next } from 'hono';
import { db } from '../db/sqlite';
import * as jose from 'jose';
import { scryptSync, randomBytes } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'maynd-admin-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export async function generateToken(userId: string, username: string, email: string, role: string): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET);
  const token = await new jose.SignJWT({ userId, username, email, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(secret);
  return token;
}

export async function verifyToken(token: string): Promise<{ userId: string; username: string; email: string; role: string } | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    return {
      userId: payload.userId as string,
      username: payload.username as string,
      email: payload.email as string,
      role: payload.role as string
    };
  } catch {
    return null;
  }
}

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized: No token provided' }, 401);
  }
  const token = authHeader.substring(7);
  const user = await verifyToken(token);
  if (!user) {
    return c.json({ success: false, error: 'Unauthorized: Invalid token' }, 401);
  }
  const dbUser = db.prepare('SELECT id, username, email, role, status FROM admin_users WHERE id = ?').get(user.userId) as { id: string; username: string; email: string; role: string; status: string } | undefined;
  if (!dbUser || dbUser.status !== 'active') {
    return c.json({ success: false, error: 'Unauthorized: User not found or inactive' }, 401);
  }
  c.set('user', { ...user, id: dbUser.id, username: dbUser.username, email: dbUser.email, role: dbUser.role });
  await next();
}

export function roleMiddleware(requiredRoles: string[]) {
  return async (c: Context, next: Next) => {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized: No user context' }, 401);
    }
    if (!requiredRoles.includes(user.role)) {
      return c.json({ success: false, error: `Forbidden: Requires one of these roles: ${requiredRoles.join(', ')}` }, 403);
    }
    await next();
  };
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, hash: string): boolean {
  const [salt, storedHash] = hash.split(':');
  const newHash = scryptSync(password, salt, 64).toString('hex');
  return newHash === storedHash;
}
