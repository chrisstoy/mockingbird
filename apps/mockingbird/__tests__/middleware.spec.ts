jest.mock('next/server', () => ({
  NextResponse: {
    next: jest.fn(() => ({ type: 'next' as const })),
    redirect: jest.fn((url: URL) => ({
      type: 'redirect' as const,
      url: url.toString(),
    })),
    json: jest.fn(
      (body: unknown, init?: { status?: number }) => ({
        type: 'json' as const,
        body,
        status: init?.status ?? 200,
      })
    ),
  },
}));

import { NextResponse } from 'next/server';
import { maintenanceResponse } from '../src/lib/maintenanceMode';

const _mockNext = NextResponse.next as jest.Mock;
const mockRedirect = NextResponse.redirect as jest.Mock;
const mockJson = NextResponse.json as jest.Mock;

function makeRequest(pathname: string) {
  return {
    nextUrl: {
      pathname,
      toString: () => `http://localhost:3000${pathname}`,
    },
    url: `http://localhost:3000${pathname}`,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

describe('maintenanceResponse', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.MAINTENANCE_MODE;
  });

  describe('when MAINTENANCE_MODE is not set', () => {
    it('returns null (pass through)', () => {
      const result = maintenanceResponse(makeRequest('/feed'));
      expect(result).toBeNull();
    });
  });

  describe("when MAINTENANCE_MODE='false'", () => {
    beforeEach(() => {
      process.env.MAINTENANCE_MODE = 'false';
    });

    it('returns null (pass through)', () => {
      const result = maintenanceResponse(makeRequest('/feed'));
      expect(result).toBeNull();
    });
  });

  describe('when MAINTENANCE_MODE=true', () => {
    beforeEach(() => {
      process.env.MAINTENANCE_MODE = 'true';
    });

    it('returns null for /_next/ paths', () => {
      expect(maintenanceResponse(makeRequest('/_next/static/chunk.js'))).toBeNull();
    });

    it('returns null for /icons/ paths', () => {
      expect(maintenanceResponse(makeRequest('/icons/icon-192.png'))).toBeNull();
    });

    it('returns null for /images/ paths', () => {
      expect(maintenanceResponse(makeRequest('/images/mockingbird-logo.png'))).toBeNull();
    });

    it('returns null for /manifest.webmanifest', () => {
      expect(maintenanceResponse(makeRequest('/manifest.webmanifest'))).toBeNull();
    });

    it('returns null for /favicon paths', () => {
      expect(maintenanceResponse(makeRequest('/favicon.ico'))).toBeNull();
    });

    it('returns null for /maintenance', () => {
      expect(maintenanceResponse(makeRequest('/maintenance'))).toBeNull();
    });

    it('returns 200 JSON { status: maintenance } for /api/health', () => {
      maintenanceResponse(makeRequest('/api/health'));
      expect(mockJson).toHaveBeenCalledWith(
        { status: 'maintenance' },
        { status: 200 }
      );
    });

    it('returns 503 JSON for other /api/ routes', () => {
      maintenanceResponse(makeRequest('/api/posts'));
      expect(mockJson).toHaveBeenCalledWith(
        { error: 'Service temporarily unavailable - maintenance in progress' },
        { status: 503 }
      );
    });

    it('returns redirect to /maintenance for /feed', () => {
      maintenanceResponse(makeRequest('/feed'));
      expect(mockRedirect).toHaveBeenCalledTimes(1);
      expect(mockRedirect.mock.calls[0][0].toString()).toContain('/maintenance');
    });

    it('returns redirect to /maintenance for /auth/signin', () => {
      maintenanceResponse(makeRequest('/auth/signin'));
      expect(mockRedirect).toHaveBeenCalledTimes(1);
      expect(mockRedirect.mock.calls[0][0].toString()).toContain('/maintenance');
    });

    it('returns redirect to /maintenance for /', () => {
      maintenanceResponse(makeRequest('/'));
      expect(mockRedirect).toHaveBeenCalledTimes(1);
    });
  });

  describe("when MAINTENANCE_MODE='1' (non-'true' value)", () => {
    beforeEach(() => {
      process.env.MAINTENANCE_MODE = '1';
    });

    it('returns null (pass through)', () => {
      const result = maintenanceResponse(makeRequest('/feed'));
      expect(result).toBeNull();
    });
  });
});
