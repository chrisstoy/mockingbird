// Mock next/server before importing middleware
const mockNext = jest.fn(() => ({ type: 'next' as const }));
const mockRedirect = jest.fn((url: URL) => ({ type: 'redirect' as const, url: url.toString() }));
const mockJson = jest.fn((body: unknown, init?: { status?: number }) => ({
  type: 'json' as const,
  body,
  status: init?.status ?? 200,
}));

jest.mock('next/server', () => ({
  NextResponse: {
    next: mockNext,
    redirect: mockRedirect,
    json: mockJson,
  },
}));

// Import after mock is set up
import { middleware } from '../middleware';

function makeRequest(pathname: string): { nextUrl: { pathname: string; toString: () => string }; url: string } {
  return {
    nextUrl: {
      pathname,
      toString: () => `http://localhost:3000${pathname}`,
    },
    url: `http://localhost:3000${pathname}`,
  } as any;
}

describe('middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.MAINTENANCE_MODE;
  });

  describe('when MAINTENANCE_MODE is not set', () => {
    it('passes all requests through', () => {
      middleware(makeRequest('/feed') as any);
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockRedirect).not.toHaveBeenCalled();
      expect(mockJson).not.toHaveBeenCalled();
    });
  });

  describe('when MAINTENANCE_MODE=true', () => {
    beforeEach(() => {
      process.env.MAINTENANCE_MODE = 'true';
    });

    it('passes /_next/ requests through', () => {
      middleware(makeRequest('/_next/static/chunk.js') as any);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('passes /icons/ requests through', () => {
      middleware(makeRequest('/icons/icon-192.png') as any);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('passes /images/ requests through', () => {
      middleware(makeRequest('/images/mockingbird-logo.png') as any);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('passes /manifest.webmanifest through', () => {
      middleware(makeRequest('/manifest.webmanifest') as any);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('passes /favicon requests through', () => {
      middleware(makeRequest('/favicon.ico') as any);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('passes /maintenance through', () => {
      middleware(makeRequest('/maintenance') as any);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('returns 200 with maintenance status for /api/health', () => {
      middleware(makeRequest('/api/health') as any);
      expect(mockJson).toHaveBeenCalledWith(
        { status: 'maintenance' },
        { status: 200 }
      );
    });

    it('returns 503 for other /api/ routes', () => {
      middleware(makeRequest('/api/posts') as any);
      expect(mockJson).toHaveBeenCalledWith(
        { error: 'Service temporarily unavailable - maintenance in progress' },
        { status: 503 }
      );
    });

    it('redirects /feed to /maintenance', () => {
      middleware(makeRequest('/feed') as any);
      expect(mockRedirect).toHaveBeenCalledTimes(1);
      const redirectUrl = mockRedirect.mock.calls[0][0].toString();
      expect(redirectUrl).toContain('/maintenance');
    });

    it('redirects /auth/signin to /maintenance', () => {
      middleware(makeRequest('/auth/signin') as any);
      expect(mockRedirect).toHaveBeenCalledTimes(1);
      const redirectUrl = mockRedirect.mock.calls[0][0].toString();
      expect(redirectUrl).toContain('/maintenance');
    });

    it('redirects / to /maintenance', () => {
      middleware(makeRequest('/') as any);
      expect(mockRedirect).toHaveBeenCalledTimes(1);
    });
  });
});
