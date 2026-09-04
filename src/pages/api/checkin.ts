import type { APIRoute } from 'astro';
import { getDb, queryOne, queryAll, runSql } from '../../lib/db';
import { createNotification } from '../../lib/notifications';
import { v4 as uuidv4 } from 'uuid';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { visitor_name, organization, phone, category_id, staff_id, location, visitor_id } = body;

    if (!visitor_name || !category_id || !staff_id) {
      return new Response(JSON.stringify({ error: 'Nama, tujuan, dan staf wajib diisi' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = await getDb();
    let visitorId: number;
    let qrToken: string | null = null;

    if (visitor_id) {
      visitorId = parseInt(visitor_id, 10);
      const existing = queryOne(db, 'SELECT id, qr_token FROM visitors WHERE id = ?', [visitorId]);
      if (!existing) {
        return new Response(JSON.stringify({ error: 'Data pengunjung tidak ditemukan' }), {
          status: 404, headers: { 'Content-Type': 'application/json' },
        });
      }
      qrToken = existing.qr_token as string | null;
    } else {
      const existing = queryOne(db,
        'SELECT id, qr_token FROM visitors WHERE name = ? AND organization = ?',
        [visitor_name, organization || '']
      );

      if (existing) {
        visitorId = existing.id as number;
        qrToken = existing.qr_token as string | null;

        const countRow = queryOne(db, 'SELECT COUNT(*) as cnt FROM visits WHERE visitor_id = ?', [visitorId]);
        if (!qrToken && countRow && (countRow.cnt as number) >= 1) {
          qrToken = uuidv4();
          runSql(db, 'UPDATE visitors SET qr_token = ? WHERE id = ?', [qrToken, visitorId]);
        }
      } else {
        const result = runSql(db,
          'INSERT INTO visitors (name, organization, phone) VALUES (?, ?, ?)',
          [visitor_name, organization || null, phone || null]
        );
        visitorId = result.lastId;
      }
    }

    // Check watchlist
    const watchEntry = queryOne(db,
      "SELECT level, reason FROM watchlist WHERE visitor_id = ? ORDER BY created_at DESC LIMIT 1",
      [visitorId]
    );

    if (watchEntry?.level === 'blocked') {
      return new Response(JSON.stringify({
        error: `Pengunjung ini tidak diizinkan masuk. Alasan: ${watchEntry.reason || 'Hubungi petugas.'}`,
      }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    let finalCategoryId = parseInt(category_id, 10);
    if (isNaN(finalCategoryId) && typeof category_id === 'string') {
      const catCheck = queryOne(db, 'SELECT id FROM visit_categories WHERE name = ?', [category_id]);
      if (catCheck) {
        finalCategoryId = catCheck.id as number;
      } else {
        const newCat = runSql(db, 'INSERT INTO visit_categories (name) VALUES (?)', [category_id]);
        finalCategoryId = newCat.lastId;
      }
    }

    // Create visit
    const visit = runSql(db,
      `INSERT INTO visits (visitor_id, staff_id, category_id, location, status) VALUES (?, ?, ?, ?, 'waiting')`,
      [visitorId, staff_id, finalCategoryId, location || 'Gedung Utama']
    );
    const visitId = visit.lastId;

    const category = queryOne(db, 'SELECT name FROM visit_categories WHERE id = ?', [finalCategoryId]);
    const staffRow = queryOne(db, 'SELECT name FROM staff WHERE id = ?', [staff_id]);

    await createNotification(visitId, staff_id, visitor_name, (category?.name as string) || '');

    return new Response(JSON.stringify({
      success: true,
      visit_id: visitId,
      visitor_name,
      category: category?.name || '',
      staff_name: staffRow?.name || '',
      qr_token: qrToken,
      watchlist_warning: watchEntry?.level === 'warning' ? watchEntry.reason : null,
    }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    console.error('[API] Check-in error:', err);
    return new Response(JSON.stringify({ error: 'Terjadi kesalahan server' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};
