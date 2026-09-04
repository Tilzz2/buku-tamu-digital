import { getDb, runSql } from './db';

/**
 * Logs an admin action to the audit_logs table.
 */
export async function logAudit(adminId: number, action: string, detail?: string) {
  const db = await getDb();
  runSql(db, 'INSERT INTO audit_logs (admin_id, action, detail) VALUES (?, ?, ?)', [
    adminId, action, detail || null,
  ]);
}
