import type { APIRoute } from 'astro';
import { getDb, queryAll } from '../../../lib/db';
import { getAdminFromRequest } from '../../../lib/auth';

export const GET: APIRoute = async ({ url, request }) => {
  const admin = await getAdminFromRequest(request);
  if (!admin) return new Response('Unauthorized', { status: 401 });

  const db = await getDb();
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const offset = (page - 1) * limit;

  const rows = queryAll(db, `
    SELECT al.id, al.action, al.detail, al.created_at,
           a.username as admin_name
    FROM audit_logs al
    LEFT JOIN admins a ON a.id = al.admin_id
    ORDER BY al.created_at DESC
    LIMIT ? OFFSET ?
  `, [limit, offset]);

  return new Response(JSON.stringify(rows), { headers: { 'Content-Type': 'application/json' } });
};
