import type { APIRoute } from 'astro';

/**
 * Simple QR code image generator using a public-style SVG approach.
 * For a fully offline solution, replace with a bundled QR library.
 * This generates a simple placeholder; the real QR generation
 * would use a library like `qrcode` npm package.
 */
export const GET: APIRoute = async ({ url }) => {
  const token = url.searchParams.get('token');
  if (!token) {
    return new Response('Missing token', { status: 400 });
  }

  // Generate a simple SVG QR placeholder with the token text
  // In production, use the `qrcode` npm package for real QR codes
  const size = 180;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="white" rx="8"/>
    <rect x="16" y="16" width="40" height="40" fill="#1e293b" rx="4"/>
    <rect x="20" y="20" width="32" height="32" fill="white" rx="2"/>
    <rect x="26" y="26" width="20" height="20" fill="#1e293b" rx="2"/>
    <rect x="${size-56}" y="16" width="40" height="40" fill="#1e293b" rx="4"/>
    <rect x="${size-52}" y="20" width="32" height="32" fill="white" rx="2"/>
    <rect x="${size-46}" y="26" width="20" height="20" fill="#1e293b" rx="2"/>
    <rect x="16" y="${size-56}" width="40" height="40" fill="#1e293b" rx="4"/>
    <rect x="20" y="${size-52}" width="32" height="32" fill="white" rx="2"/>
    <rect x="26" y="${size-46}" width="20" height="20" fill="#1e293b" rx="2"/>
    <text x="${size/2}" y="${size/2 + 5}" text-anchor="middle" font-family="monospace" font-size="9" fill="#475569">${token.substring(0, 8)}...</text>
  </svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
