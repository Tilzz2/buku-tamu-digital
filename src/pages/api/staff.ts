import type { APIRoute } from 'astro';
import { getDb, queryAll } from '../../lib/db';

export const GET: APIRoute = async () => {
  const db = await getDb();
  const staff = queryAll(db, "SELECT id, name, department FROM staff WHERE status = 'active' ORDER BY name");
  return new Response(JSON.stringify(staff), { headers: { 'Content-Type': 'application/json' } });
};
