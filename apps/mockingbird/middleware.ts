// apps/mockingbird/middleware.ts
import { NextRequest, NextResponse } from 'next/server';

const PASS_THROUGH_PREFIXES = [
  '/_next/',
  '/icons/',
  '/images/',
  '/manifest.webmanifest',
  '/favicon',
  '/maintenance',
];

export function middleware(request: NextRequest) {
  if (process.env.MAINTENANCE_MODE !== 'true') {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (PASS_THROUGH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  if (pathname === '/api/health') {
    return NextResponse.json({ status: 'maintenance' }, { status: 200 });
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      { error: 'Service temporarily unavailable - maintenance in progress' },
      { status: 503 }
    );
  }

  return NextResponse.redirect(new URL('/maintenance', request.url));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
