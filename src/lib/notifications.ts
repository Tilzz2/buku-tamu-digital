import { getDb, queryAll, queryOne, runSql } from './db';

// ─── SSE connection registry ─────────────────────────────────────────────────
const staffConnections = new Map<number, Set<WritableStreamDefaultWriter<Uint8Array>>>();

export function registerStaffConnection(staffId: number, writer: WritableStreamDefaultWriter<Uint8Array>) {
  if (!staffConnections.has(staffId)) {
    staffConnections.set(staffId, new Set());
  }
  staffConnections.get(staffId)!.add(writer);
}

export function removeStaffConnection(staffId: number, writer: WritableStreamDefaultWriter<Uint8Array>) {
  const conns = staffConnections.get(staffId);
  if (conns) {
    conns.delete(writer);
    if (conns.size === 0) staffConnections.delete(staffId);
  }
}

export async function notifyStaff(staffId: number, data: Record<string, unknown>) {
  const conns = staffConnections.get(staffId);
  if (!conns || conns.size === 0) return false;

  const encoder = new TextEncoder();
  const payload = encoder.encode(`data: ${JSON.stringify(data)}\n\n`);

  for (const writer of conns) {
    try {
      await writer.write(payload);
    } catch {
      conns.delete(writer);
    }
  }
  return true;
}

export async function createNotification(visitId: number, staffId: number, visitorName: string, category: string) {
  const db = await getDb();
  runSql(db, `INSERT INTO notification_logs (visit_id, staff_id, status) VALUES (?, ?, 'sent')`, [visitId, staffId]);

  const delivered = await notifyStaff(staffId, {
    type: 'new_visit',
    visitId,
    visitorName,
    category,
    timestamp: new Date().toISOString(),
  });

  return delivered;
}

const ESCALATION_TIMEOUT_MS = 5 * 60 * 1000;

export async function checkEscalations() {
  const db = await getDb();
  const cutoff = new Date(Date.now() - ESCALATION_TIMEOUT_MS).toISOString();

  const stale = queryAll(db,
    `SELECT nl.id, nl.visit_id, nl.staff_id, nl.sent_at,
            v.visitor_id, vis.name as visitor_name
     FROM notification_logs nl
     JOIN visits v ON v.id = nl.visit_id
     JOIN visitors vis ON vis.id = v.visitor_id
     WHERE nl.status = 'sent' AND nl.sent_at < ?`,
    [cutoff]
  );

  for (const row of stale) {
    runSql(db, `UPDATE notification_logs SET status = 'escalated' WHERE id = ?`, [row.id]);
  }

  return stale;
}
