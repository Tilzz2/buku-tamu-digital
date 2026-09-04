import type { APIRoute } from 'astro';
import { checkEscalations } from '../../../lib/notifications';
import { getDb, queryAll } from '../../../lib/db';

export const GET: APIRoute = async () => {
  const encoder = new TextEncoder();
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  await writer.write(encoder.encode(`: connected\n\n`));

  // Poll for escalations every 30 seconds
  const poll = setInterval(async () => {
    try {
      const escalated = await checkEscalations();
      if (escalated.length > 0) {
        await writer.write(encoder.encode(`event: escalation\ndata: ${JSON.stringify(escalated)}\n\n`));
      }

      // Also send current waiting visits count
      const db = await getDb();
      const waiting = queryAll(db, `SELECT COUNT(*) as cnt FROM visits WHERE status = 'waiting'`);
      const accepted = queryAll(db, `SELECT COUNT(*) as cnt FROM visits WHERE status = 'accepted'`);
      await writer.write(encoder.encode(`event: stats\ndata: ${JSON.stringify({
        waiting: waiting[0]?.cnt || 0,
        accepted: accepted[0]?.cnt || 0,
      })}\n\n`));
    } catch {
      clearInterval(poll);
    }
  }, 30000);

  // Send initial stats immediately
  try {
    const db = await getDb();
    const waiting = queryAll(db, `SELECT COUNT(*) as cnt FROM visits WHERE status = 'waiting'`);
    const accepted = queryAll(db, `SELECT COUNT(*) as cnt FROM visits WHERE status = 'accepted'`);
    const todayVisits = queryAll(db, `SELECT COUNT(*) as cnt FROM visits WHERE date(check_in_time) = date('now')`);
    await writer.write(encoder.encode(`event: stats\ndata: ${JSON.stringify({
      waiting: waiting[0]?.cnt || 0,
      accepted: accepted[0]?.cnt || 0,
      today: todayVisits[0]?.cnt || 0,
    })}\n\n`));

    // Check escalations immediately
    const escalated = await checkEscalations();
    if (escalated.length > 0) {
      await writer.write(encoder.encode(`event: escalation\ndata: ${JSON.stringify(escalated)}\n\n`));
    }
  } catch {}

  // Keepalive
  const keepalive = setInterval(async () => {
    try {
      await writer.write(encoder.encode(`: keepalive\n\n`));
    } catch {
      clearInterval(keepalive);
      clearInterval(poll);
    }
  }, 15000);

  readable.pipeTo(new WritableStream()).catch(() => {
    clearInterval(poll);
    clearInterval(keepalive);
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
};
