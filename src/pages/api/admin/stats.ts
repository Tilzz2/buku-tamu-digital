import type { APIRoute } from 'astro';
import { getDb, queryAll } from '../../../lib/db';
import { getAdminFromRequest } from '../../../lib/auth';

export const GET: APIRoute = async ({ url, request }) => {
  const admin = await getAdminFromRequest(request);
  if (!admin) return new Response('Unauthorized', { status: 401 });

  const db = await getDb();
  const days = parseInt(url.searchParams.get('days') || '30');

  // Visits per day
  const visitsByDay = queryAll(db, `
    SELECT date(check_in_time) as day, COUNT(*) as count
    FROM visits
    WHERE check_in_time >= date('now', '-${days} days')
    GROUP BY date(check_in_time)
    ORDER BY day
  `);

  // Visits by department (via staff)
  const visitsByDept = queryAll(db, `
    SELECT COALESCE(s.department, 'Tidak ada') as department, COUNT(*) as count
    FROM visits v
    LEFT JOIN staff s ON s.id = v.staff_id
    WHERE v.check_in_time >= date('now', '-${days} days')
    GROUP BY s.department
    ORDER BY count DESC
  `);

  // Visits by category
  const visitsByCategory = queryAll(db, `
    SELECT COALESCE(vc.name, 'Lainnya') as category, COUNT(*) as count
    FROM visits v
    LEFT JOIN visit_categories vc ON vc.id = v.category_id
    WHERE v.check_in_time >= date('now', '-${days} days')
    GROUP BY vc.name
    ORDER BY count DESC
  `);

  // Status breakdown
  const visitsByStatus = queryAll(db, `
    SELECT status, COUNT(*) as count
    FROM visits
    WHERE check_in_time >= date('now', '-${days} days')
    GROUP BY status
  `);

  return new Response(JSON.stringify({ visitsByDay, visitsByDept, visitsByCategory, visitsByStatus }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
