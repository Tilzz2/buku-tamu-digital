import type { APIRoute } from 'astro';
import { getDb, queryAll, queryOne, runSql } from '../../../lib/db';
import { getAdminFromRequest } from '../../../lib/auth';
import { logAudit } from '../../../lib/audit';

export const GET: APIRoute = async ({ request }) => {
  const admin = await getAdminFromRequest(request);
  if (!admin) return new Response('Unauthorized', { status: 401 });

  const db = await getDb();
  const watchlist = queryAll(db, `
    SELECT w.id, w.reason, w.level, w.created_at,
           vis.id as visitor_id, vis.name as visitor_name, vis.organization
    FROM watchlist w
    JOIN visitors vis ON vis.id = w.visitor_id
    ORDER BY w.created_at DESC
  `);
  return new Response(JSON.stringify(watchlist), { headers: { 'Content-Type': 'application/json' } });
};

export const POST: APIRoute = async ({ request }) => {
  const admin = await getAdminFromRequest(request);
  if (!admin) return new Response('Unauthorized', { status: 401 });

  const db = await getDb();
  const body = await request.json();
  const { visitor_id, reason, level } = body;

  if (!visitor_id || !level) {
    return new Response(JSON.stringify({ error: 'visitor_id dan level wajib' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const result = runSql(db, 'INSERT INTO watchlist (visitor_id, reason, level, created_by) VALUES (?, ?, ?, ?)',
    [visitor_id, reason || null, level, admin.id]);
  
  const visitor = queryOne(db, 'SELECT name FROM visitors WHERE id = ?', [visitor_id]);
  await logAudit(admin.id, 'add_watchlist', `Added ${visitor?.name} to watchlist (${level}): ${reason || 'no reason'}`);

  return new Response(JSON.stringify({ success: true, id: result.lastId }), { status: 201, headers: { 'Content-Type': 'application/json' } });
};

export const DELETE: APIRoute = async ({ request }) => {
  const admin = await getAdminFromRequest(request);
  if (!admin) return new Response('Unauthorized', { status: 401 });

  const db = await getDb();
  const body = await request.json();
  const { id } = body;

  const entry = queryOne(db, 'SELECT w.visitor_id, vis.name FROM watchlist w JOIN visitors vis ON vis.id = w.visitor_id WHERE w.id = ?', [id]);
  runSql(db, 'DELETE FROM watchlist WHERE id = ?', [id]);
  await logAudit(admin.id, 'remove_watchlist', `Removed ${entry?.name} from watchlist`);

  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};
