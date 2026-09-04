import type { APIRoute } from 'astro';
import { registerStaffConnection, removeStaffConnection } from '../../../../lib/notifications';

export const GET: APIRoute = async ({ params }) => {
  const staffId = parseInt(params.id || '', 10);
  if (isNaN(staffId)) {
    return new Response('Invalid staff ID', { status: 400 });
  }

  const encoder = new TextEncoder();
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  // Send initial keepalive
  await writer.write(encoder.encode(`: connected\n\n`));

  registerStaffConnection(staffId, writer);

  // Keepalive every 30s
  const keepalive = setInterval(async () => {
    try {
      await writer.write(encoder.encode(`: keepalive\n\n`));
    } catch {
      clearInterval(keepalive);
    }
  }, 30000);

  // Clean up when the client disconnects
  readable.pipeTo(new WritableStream()).catch(() => {});
  
  // Use the request signal to detect disconnection
  const cleanup = () => {
    clearInterval(keepalive);
    removeStaffConnection(staffId, writer);
    try { writer.close(); } catch {}
  };

  // The connection will stay open until the client closes
  // We rely on the TransformStream staying open
  // Add cleanup on abort if available
  setTimeout(() => {
    // Periodic check — if writer is errored, clean up
    const checkAlive = setInterval(async () => {
      try {
        await writer.write(encoder.encode(`: ping\n\n`));
      } catch {
        clearInterval(checkAlive);
        cleanup();
      }
    }, 60000);
  }, 5000);

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
};
