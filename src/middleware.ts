import { defineMiddleware } from 'astro:middleware';
import { getAdminFromRequest } from './lib/auth';

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Only protect /admin/* routes (except login page)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const admin = await getAdminFromRequest(context.request);
    if (!admin) {
      return context.redirect('/admin/login');
    }
    // Attach admin info to locals for use in pages
    context.locals.admin = admin;
  }

  return next();
});
