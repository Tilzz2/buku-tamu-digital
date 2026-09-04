import type { APIRoute } from 'astro';
import { getDb, queryAll, runSql } from '../../../lib/db';
import { getAdminFromRequest } from '../../../lib/auth';
import { logAudit } from '../../../lib/audit';

export const GET: APIRoute = async ({ request }) => {
  const admin = await getAdminFromRequest(request);
  if (!admin) return new Response('Unauthorized', { status: 401 });

  const db = await getDb();
  const categories = queryAll(db, 'SELECT id, name FROM visit_categories ORDER BY name');
  return new Response(JSON.stringify(categories), { headers: { 'Content-Type': 'application/json' } });
};

export const POST: APIRoute = async ({ request }) => {
  const admin = await getAdminFromRequest(request);
  if (!admin) return new Response('Unauthorized', { status: 401 });

  const db = await getDb();
  const body = await request.json();
  const { name } = body;
  if (!name) return new Response(JSON.stringify({ error: 'Nama kategori wajib' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  try {
    const result = runSql(db, 'INSERT INTO visit_categories (name) VALUES (?)', [name]);
    await logAudit(admin.id, 'create_category', `Created category: ${name}`);
    return new Response(JSON.stringify({ success: true, id: result.lastId }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch {
    return new Response(JSON.stringify({ error: 'Kategori sudah ada' }), { status: 409, headers: { 'Content-Type': 'application/json' } });
  }
};

export const PUT: APIRoute = async ({ request }) => {
  const admin = await getAdminFromRequest(request);
  if (!admin) return new Response('Unauthorized', { status: 401 });

  const db = await getDb();
  const body = await request.json();
  const { id, name } = body;
  if (!id || !name) return new Response(JSON.stringify({ error: 'ID dan nama wajib' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  runSql(db, 'UPDATE visit_categories SET name = ? WHERE id = ?', [name, id]);
  await logAudit(admin.id, 'update_category', `Updated category #${id}: ${name}`);
  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};

export const DELETE: APIRoute = async ({ request }) => {
  const admin = await getAdminFromRequest(request);
  if (!admin) return new Response('Unauthorized', { status: 401 });

  const db = await getDb();
  const body = await request.json();
  const { id } = body;

  runSql(db, 'DELETE FROM visit_categories WHERE id = ?', [id]);
  await logAudit(admin.id, 'delete_category', `Deleted category #${id}`);
  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};
