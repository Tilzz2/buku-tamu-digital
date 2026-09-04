import bcrypt from 'bcryptjs';
import { getDb, queryOne } from './db';

const COOKIE_NAME = 'guestbook_admin';
const SESSION_MAX_AGE = 60 * 60 * 24; // 24 hours

export async function verifyAdmin(username: string, password: string) {
  const db = await getDb();
  const admin = queryOne(db, 'SELECT * FROM admins WHERE username = ?', [username]);
  if (!admin) return null;
  if (!bcrypt.compareSync(password, admin.password_hash as string)) return null;
  return { id: admin.id as number, username: admin.username as string };
}

export function createSessionToken(adminId: number, username: string): string {
  const payload = `${adminId}:${username}:${Date.now()}`;
  return Buffer.from(payload).toString('base64');
}

export async function parseSessionToken(token: string): Promise<{ id: number; username: string } | null> {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [idStr, username, timestampStr] = decoded.split(':');
    const id = parseInt(idStr, 10);
    const timestamp = parseInt(timestampStr, 10);

    if (isNaN(id) || !username || isNaN(timestamp)) return null;
    if (Date.now() - timestamp > SESSION_MAX_AGE * 1000) return null;

    const db = await getDb();
    const admin = queryOne(db, 'SELECT id FROM admins WHERE id = ?', [id]);
    if (!admin) return null;

    return { id, username };
  } catch {
    return null;
  }
}

export async function getAdminFromRequest(request: Request): Promise<{ id: number; username: string } | null> {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [key, ...rest] = c.trim().split('=');
      return [key, rest.join('=')];
    })
  );

  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  return parseSessionToken(token);
}

export function buildAuthCookie(token: string): string {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_MAX_AGE}`;
}

export function buildLogoutCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;
}

export { COOKIE_NAME };
