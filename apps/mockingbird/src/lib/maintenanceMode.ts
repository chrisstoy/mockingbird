import { get } from '@vercel/edge-config';
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
 * Returns the Edge Config key for maintenance mode based on the current
 * Vercel environment. Falls back to the MAINTENANCE_MODE env var when
 * EDGE_CONFIG is not configured (local dev).
 */
async function isMaintenanceMode(): Promise<boolean> {
  if (process.env.EDGE_CONFIG) {
    try {
      const env = process.env.VERCEL_ENV ?? 'preview';
      const key =
        env === 'production'
          ? 'productionMaintenanceMode'
          : 'previewMaintenanceMode';
      const value = await get<boolean>(key);
      return value === true;
    } catch {
      // Fall through to env var fallback
    }
  }
  return process.env.MAINTENANCE_MODE === 'true';
}

/**
 * Returns a maintenance response if maintenance mode is enabled and the path
 * is not in the pass-through list. Returns null to continue normal handling.
 */
export async function maintenanceResponse(
  request: NextRequest
): Promise<NextResponse | null> {
  if (!(await isMaintenanceMode())) return null;

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
