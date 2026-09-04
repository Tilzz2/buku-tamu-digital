import type { APIRoute } from 'astro';
import { getDb, queryAll, queryOne, runSql } from '../../../lib/db';
import { getAdminFromRequest } from '../../../lib/auth';
import { logAudit } from '../../../lib/audit';

export const GET: APIRoute = async ({ request }) => {
  const admin = await getAdminFromRequest(request);
  if (!admin) return new Response('Unauthorized', { status: 401 });

  const db = await getDb();
  const staff = queryAll(db, "SELECT id, name, department, email, status FROM staff ORDER BY name");
  return new Response(JSON.stringify(staff), { headers: { 'Content-Type': 'application/json' } });
};

export const POST: APIRoute = async ({ request }) => {
  const admin = await getAdminFromRequest(request);
  if (!admin) return new Response('Unauthorized', { status: 401 });

  const db = await getDb();
  const body = await request.json();
  const { name, department, email } = body;
  if (!name) return new Response(JSON.stringify({ error: 'Nama wajib diisi' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  const result = runSql(db, 'INSERT INTO staff (name, department, email) VALUES (?, ?, ?)', [name, department || null, email || null]);
  await logAudit(admin.id, 'create_staff', `Created staff: ${name}`);

  return new Response(JSON.stringify({ success: true, id: result.lastId }), { status: 201, headers: { 'Content-Type': 'application/json' } });
};

export const PUT: APIRoute = async ({ request }) => {
  const admin = await getAdminFromRequest(request);
  if (!admin) return new Response('Unauthorized', { status: 401 });

  const db = await getDb();
  const body = await request.json();
  const { id, name, department, email, status } = body;
  if (!id) return new Response(JSON.stringify({ error: 'ID wajib' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  runSql(db, 'UPDATE staff SET name = ?, department = ?, email = ?, status = ? WHERE id = ?', [name, department || null, email || null, status || 'active', id]);
  await logAudit(admin.id, 'update_staff', `Updated staff #${id}: ${name}`);

  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};

export const DELETE: APIRoute = async ({ request }) => {
  const admin = await getAdminFromRequest(request);
  if (!admin) return new Response('Unauthorized', { status: 401 });

  const db = await getDb();
  const body = await request.json();
  const { id } = body;

  runSql(db, "UPDATE staff SET status = 'inactive' WHERE id = ?", [id]);
  await logAudit(admin.id, 'deactivate_staff', `Deactivated staff #${id}`);

  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};
