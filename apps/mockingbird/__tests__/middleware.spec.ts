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

jest.mock('@vercel/edge-config', () => ({
  get: jest.fn(),
}));

import { get } from '@vercel/edge-config';
import { NextResponse } from 'next/server';
import { maintenanceResponse } from '../src/lib/maintenanceMode';

const mockGet = get as jest.Mock;
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
    delete process.env.EDGE_CONFIG;
    mockGet.mockResolvedValue(false);
  });

  describe('when EDGE_CONFIG is not set (local dev fallback)', () => {
    describe('when MAINTENANCE_MODE is not set', () => {
      it('returns null (pass through)', async () => {
        const result = await maintenanceResponse(makeRequest('/feed'));
        expect(result).toBeNull();
      });
    });

    describe("when MAINTENANCE_MODE='false'", () => {
      beforeEach(() => {
        process.env.MAINTENANCE_MODE = 'false';
      });

      it('returns null (pass through)', async () => {
        const result = await maintenanceResponse(makeRequest('/feed'));
        expect(result).toBeNull();
      });
    });

    describe('when MAINTENANCE_MODE=true', () => {
      beforeEach(() => {
        process.env.MAINTENANCE_MODE = 'true';
      });

      it('returns null for /_next/ paths', async () => {
        expect(await maintenanceResponse(makeRequest('/_next/static/chunk.js'))).toBeNull();
      });

      it('returns null for /icons/ paths', async () => {
        expect(await maintenanceResponse(makeRequest('/icons/icon-192.png'))).toBeNull();
      });

      it('returns null for /images/ paths', async () => {
        expect(await maintenanceResponse(makeRequest('/images/mockingbird-logo.png'))).toBeNull();
      });

      it('returns null for /manifest.webmanifest', async () => {
        expect(await maintenanceResponse(makeRequest('/manifest.webmanifest'))).toBeNull();
      });

      it('returns null for /favicon paths', async () => {
        expect(await maintenanceResponse(makeRequest('/favicon.ico'))).toBeNull();
      });

      it('returns null for /maintenance', async () => {
        expect(await maintenanceResponse(makeRequest('/maintenance'))).toBeNull();
      });

      it('returns 200 JSON { status: maintenance } for /api/health', async () => {
        await maintenanceResponse(makeRequest('/api/health'));
        expect(mockJson).toHaveBeenCalledWith(
          { status: 'maintenance' },
          { status: 200 }
        );
      });

      it('returns 503 JSON for other /api/ routes', async () => {
        await maintenanceResponse(makeRequest('/api/posts'));
        expect(mockJson).toHaveBeenCalledWith(
          { error: 'Service temporarily unavailable - maintenance in progress' },
          { status: 503 }
        );
      });

      it('returns redirect to /maintenance for /feed', async () => {
        await maintenanceResponse(makeRequest('/feed'));
        expect(mockRedirect).toHaveBeenCalledTimes(1);
        expect(mockRedirect.mock.calls[0][0].toString()).toContain('/maintenance');
      });

      it('returns redirect to /maintenance for /auth/signin', async () => {
        await maintenanceResponse(makeRequest('/auth/signin'));
        expect(mockRedirect).toHaveBeenCalledTimes(1);
        expect(mockRedirect.mock.calls[0][0].toString()).toContain('/maintenance');
      });

      it('returns redirect to /maintenance for /', async () => {
        await maintenanceResponse(makeRequest('/'));
        expect(mockRedirect).toHaveBeenCalledTimes(1);
      });
    });

    describe("when MAINTENANCE_MODE='1' (non-'true' value)", () => {
      beforeEach(() => {
        process.env.MAINTENANCE_MODE = '1';
      });

      it('returns null (pass through)', async () => {
        const result = await maintenanceResponse(makeRequest('/feed'));
        expect(result).toBeNull();
      });
    });
  });

  describe('when EDGE_CONFIG is set', () => {
    beforeEach(() => {
      process.env.EDGE_CONFIG = 'https://edge-config.vercel.com/ecfg_test?token=test';
    });

    describe('when previewMaintenanceMode=false in Edge Config', () => {
      beforeEach(() => {
        mockGet.mockResolvedValue(false);
      });

      it('returns null (pass through)', async () => {
        const result = await maintenanceResponse(makeRequest('/feed'));
        expect(result).toBeNull();
      });
    });

    describe('when previewMaintenanceMode=true in Edge Config', () => {
      beforeEach(() => {
        mockGet.mockResolvedValue(true);
      });

      it('reads previewMaintenanceMode key for non-production env', async () => {
        await maintenanceResponse(makeRequest('/feed'));
        expect(mockGet).toHaveBeenCalledWith('previewMaintenanceMode');
      });

      it('reads productionMaintenanceMode key for production env', async () => {
        process.env.VERCEL_ENV = 'production';
        await maintenanceResponse(makeRequest('/feed'));
        expect(mockGet).toHaveBeenCalledWith('productionMaintenanceMode');
        delete process.env.VERCEL_ENV;
      });

      it('returns redirect to /maintenance for /feed', async () => {
        await maintenanceResponse(makeRequest('/feed'));
        expect(mockRedirect).toHaveBeenCalledTimes(1);
        expect(mockRedirect.mock.calls[0][0].toString()).toContain('/maintenance');
      });

      it('returns null for /maintenance path', async () => {
        expect(await maintenanceResponse(makeRequest('/maintenance'))).toBeNull();
      });
    });

    describe('when Edge Config read fails', () => {
      beforeEach(() => {
        mockGet.mockRejectedValue(new Error('network error'));
      });

      it('falls back to MAINTENANCE_MODE env var (false)', async () => {
        const result = await maintenanceResponse(makeRequest('/feed'));
        expect(result).toBeNull();
      });

      it('falls back to MAINTENANCE_MODE env var (true)', async () => {
        process.env.MAINTENANCE_MODE = 'true';
        await maintenanceResponse(makeRequest('/feed'));
        expect(mockRedirect).toHaveBeenCalledTimes(1);
      });
    });
  });
});
