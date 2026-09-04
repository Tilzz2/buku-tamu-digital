import type { APIRoute } from 'astro';
import { getDb, queryOne } from '../../lib/db';

export const GET: APIRoute = async ({ url }) => {
  const token = url.searchParams.get('token');
  if (!token) {
    return new Response(JSON.stringify({ error: 'Token QR diperlukan' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const db = await getDb();
  const visitor = queryOne(db, 'SELECT id, name, organization, phone FROM visitors WHERE qr_token = ?', [token]);

  if (!visitor) {
    return new Response(JSON.stringify({ error: 'QR code tidak ditemukan' }), {
      status: 404, headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(visitor), { headers: { 'Content-Type': 'application/json' } });
};
