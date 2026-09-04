import type { APIRoute } from 'astro';
import { getDb, queryAll } from '../../lib/db';

export const GET: APIRoute = async () => {
  const db = await getDb();
  const categories = queryAll(db, 'SELECT id, name FROM visit_categories ORDER BY name');
  return new Response(JSON.stringify(categories), { headers: { 'Content-Type': 'application/json' } });
};
