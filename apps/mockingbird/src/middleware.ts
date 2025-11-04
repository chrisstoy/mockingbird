import { env } from '@/../env';
import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from './_utils/supabase/middleware';

// the list of all allowed origins
const allowedOrigins = [
  'http://localhost:3000',
  `https://${env.VERCEL_URL}`,
  `https:.//${env.VERCEL_PROJECT_PRODUCTION_URL}`,
];

export async function middleware(req: NextRequest) {
  // Update Supabase session (refresh if expired)
  const response = await updateSession(req);

  // Check authentication for non-API routes
  if (!req.nextUrl.pathname.startsWith('/api')) {
    // Get user from Supabase session
    const supabase = await import('./_utils/supabase/middleware').then((m) =>
      m.updateSession(req)
    );

    // For now, allow all non-API routes (auth check will be in API routes)
    // TODO: Add more sophisticated auth check here if needed
  }

  // Allowed origins check
  const origin = req.headers.get('origin') ?? '';
  const isOriginAllowed = allowedOrigins.find((o) => o && origin.includes(o));

  if (isOriginAllowed) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }

  // Set default CORS headers
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET,OPTIONS,PATCH,DELETE,POST,PUT'
  );
  response.headers.set(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Return
  return response;
}

export const config = {
  matcher: [
    '/((?!auth|api/auth|_next/static|_next/image|images|favicon.ico).*)',
  ],
  runtime: 'nodejs',
};
