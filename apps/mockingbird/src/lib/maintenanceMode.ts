import { NextRequest, NextResponse } from 'next/server';

const PASS_THROUGH_PREFIXES = [
  '/_next/',
  '/icons/',
  '/images/',
  '/manifest.webmanifest',
  '/favicon',
  '/maintenance',
  '/offline',
];

/**
 * Returns a maintenance response if MAINTENANCE_MODE=true and the path
 * is not in the pass-through list. Returns null to continue normal handling.
 */
export function maintenanceResponse(request: NextRequest): NextResponse | null {
  if (process.env.MAINTENANCE_MODE !== 'true') return null;

  const { pathname } = request.nextUrl;

  if (PASS_THROUGH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null;
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
