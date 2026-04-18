import { env } from '@/../env';
import { NextFetchEvent, NextMiddleware, NextRequest, NextResponse } from 'next/server';
import { auth } from './app/auth';
import { maintenanceResponse } from './lib/maintenanceMode';

// the list of all allowed origins
const allowedOrigins = [
  'http://localhost:3000',
  `https://${env.VERCEL_URL}`,
  `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`,
];

const authMiddleware = auth(async (req) => {
  if (!req.nextUrl.pathname.startsWith('/api') && !req.auth) {
    // not an API call and not authorized, so require signin before proceeding
    return NextResponse.redirect(
      new URL(
        `/auth/signin?callbackUrl=${encodeURIComponent(req.url)}`,
        req.url
      )
    );
  }

  const response = NextResponse.next();

  // Allowed origins check
  const origin = req.headers.get('origin') ?? '';
  const isOriginAllowed = allowedOrigins.find((o) => o && origin === o);

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
});

export default async function middleware(request: NextRequest, event: NextFetchEvent) {
  return (await maintenanceResponse(request)) ?? (authMiddleware as unknown as NextMiddleware)(request, event);
}

export const config = {
  matcher: [
    '/((?!auth|api/auth|maintenance|_next/static|_next/image|images|favicon.ico|sw\\.js|manifest\\.webmanifest|offline|icons).*)',
  ],
};
