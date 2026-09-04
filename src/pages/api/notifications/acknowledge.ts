import type { APIRoute } from 'astro';
import { getDb, queryOne, runSql } from '../../../lib/db';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { notification_id, visit_id, action } = body;

    if (!visit_id || !action) {
      return new Response(JSON.stringify({ error: 'visit_id and action are required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = await getDb();

    // Update notification status
    if (notification_id) {
      runSql(db, `UPDATE notification_logs SET status = 'read', responded_at = CURRENT_TIMESTAMP WHERE id = ?`, [notification_id]);
    } else {
      runSql(db, `UPDATE notification_logs SET status = 'read', responded_at = CURRENT_TIMESTAMP WHERE visit_id = ? AND status IN ('sent', 'escalated')`, [visit_id]);
    }

    // Update visit status based on action
    if (action === 'accept') {
      runSql(db, `UPDATE visits SET status = 'accepted' WHERE id = ?`, [visit_id]);
    } else if (action === 'done') {
      runSql(db, `UPDATE visits SET status = 'done', check_out_time = CURRENT_TIMESTAMP WHERE id = ?`, [visit_id]);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[API] Acknowledge error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};
