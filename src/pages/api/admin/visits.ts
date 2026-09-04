import type { APIRoute } from 'astro';
import { getDb, queryAll, queryOne, runSql } from '../../../lib/db';
import { getAdminFromRequest } from '../../../lib/auth';
import { logAudit } from '../../../lib/audit';

export const GET: APIRoute = async ({ url, request }) => {
  const admin = await getAdminFromRequest(request);
  if (!admin) return new Response('Unauthorized', { status: 401 });

  const db = await getDb();
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '25');
  const search = url.searchParams.get('search') || '';
  const status = url.searchParams.get('status') || '';
  const dateFrom = url.searchParams.get('date_from') || '';
  const dateTo = url.searchParams.get('date_to') || '';

  let where = 'WHERE 1=1';
  const params: any[] = [];

  if (search) {
    where += ' AND (vis.name LIKE ? OR vis.organization LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (status) {
    where += ' AND v.status = ?';
    params.push(status);
  }
  if (dateFrom) {
    where += ' AND date(v.check_in_time) >= ?';
    params.push(dateFrom);
  }
  if (dateTo) {
    where += ' AND date(v.check_in_time) <= ?';
    params.push(dateTo);
  }

  const countRow = queryOne(db, `SELECT COUNT(*) as total FROM visits v JOIN visitors vis ON vis.id = v.visitor_id ${where}`, params);
  const total = (countRow?.total as number) || 0;

  const offset = (page - 1) * limit;
  const rows = queryAll(db, `
    SELECT v.id, v.check_in_time, v.check_out_time, v.status, v.location,
           vis.name as visitor_name, vis.organization, vis.phone,
           s.name as staff_name, s.department,
           vc.name as category_name
    FROM visits v
    JOIN visitors vis ON vis.id = v.visitor_id
    LEFT JOIN staff s ON s.id = v.staff_id
    LEFT JOIN visit_categories vc ON vc.id = v.category_id
    ${where}
    ORDER BY v.check_in_time DESC
    LIMIT ? OFFSET ?
  `, [...params, limit, offset]);

  return new Response(JSON.stringify({ rows, total, page, limit, pages: Math.ceil(total / limit) }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PATCH: APIRoute = async ({ request }) => {
  const admin = await getAdminFromRequest(request);
  if (!admin) return new Response('Unauthorized', { status: 401 });

  const db = await getDb();
  const body = await request.json();
  const { visit_id, status } = body;

  if (!visit_id || !status) {
    return new Response(JSON.stringify({ error: 'visit_id and status required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  runSql(db, 'UPDATE visits SET status = ? WHERE id = ?', [status, visit_id]);
  if (status === 'done') {
    runSql(db, 'UPDATE visits SET check_out_time = CURRENT_TIMESTAMP WHERE id = ?', [visit_id]);
  }

  await logAudit(admin.id, 'update_visit', `Visit #${visit_id} status → ${status}`);

  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};
