import type { APIRoute } from 'astro';
import { verifyAdmin, createSessionToken, buildAuthCookie } from '../../../lib/auth';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return new Response(JSON.stringify({ error: 'Username dan password wajib diisi' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const admin = await verifyAdmin(username, password);
    if (!admin) {
      return new Response(JSON.stringify({ error: 'Username atau password salah' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = createSessionToken(admin.id, admin.username);
    const cookie = buildAuthCookie(token);

    return new Response(JSON.stringify({ success: true, username: admin.username }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookie,
      },
    });
  } catch (err: any) {
    console.error('[API] Login error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};
