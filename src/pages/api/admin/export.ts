import type { APIRoute } from 'astro';
import { getDb, queryAll } from '../../../lib/db';
import { getAdminFromRequest } from '../../../lib/auth';

export const GET: APIRoute = async ({ url, request }) => {
  const admin = await getAdminFromRequest(request);
  if (!admin) return new Response('Unauthorized', { status: 401 });

  const db = await getDb();
  
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

  const rows = queryAll(db, `
    SELECT v.check_in_time, v.check_out_time, v.status,
           vis.name as visitor_name, vis.organization, vis.phone,
           s.name as staff_name, s.department,
           vc.name as category_name
    FROM visits v
    JOIN visitors vis ON vis.id = v.visitor_id
    LEFT JOIN staff s ON s.id = v.staff_id
    LEFT JOIN visit_categories vc ON vc.id = v.category_id
    ${where}
    ORDER BY v.check_in_time DESC
  `, params);

  // Generate CSV
  const header = ['Waktu Masuk', 'Waktu Keluar', 'Nama Pengunjung', 'Instansi', 'No. Telepon', 'Staf Dituju', 'Departemen', 'Tujuan', 'Status'];
  const csvRows = [header.map(h => `"${h}"`).join(',')];

  for (const r of rows) {
    const row = [
      r.check_in_time || '', r.check_out_time || '',
      r.visitor_name || '', r.organization || '', r.phone || '',
      r.staff_name || '', r.department || '', r.category_name || '',
      r.status || ''
    ].map(v => `"${String(v).replace(/"/g, '""')}"`);
    csvRows.push(row.join(','));
  }

  const csv = csvRows.join('\n');
  const filename = `Data_Kunjungan_${new Date().toISOString().split('T')[0]}.csv`;

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  });
};
