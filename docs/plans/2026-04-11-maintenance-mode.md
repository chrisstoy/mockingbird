# Maintenance Mode Implementation Plan (MOC-83)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** Display a maintenance screen to all users when `MAINTENANCE_MODE=true` is set as a Vercel env var, intercepting requests before auth.

**Architecture:** A new `middleware.ts` at the Next.js app root checks `process.env.MAINTENANCE_MODE` before auth fires. UI routes redirect to `/maintenance`; API routes return 503 JSON; `/api/health` returns 200 with a maintenance status. The maintenance page reuses `AuthShell` for consistent styling.

**Tech Stack:** Next.js middleware (`next/server`), `@t3-oss/env-nextjs` + Zod, React Server Components, DaisyUI, Heroicons.

---

## Task 1: Register MAINTENANCE_MODE in env.ts

**Files:**
- Modify: `apps/mockingbird/env.ts`

**Step 1: Add the env var to the server schema**

In `apps/mockingbird/env.ts`, inside the `server: { ... }` block, add after `NODE_ENV`:

```ts
MAINTENANCE_MODE: z.enum(['true', 'false']).optional(),
```

The field is `optional()` so the app works normally when unset.

**Step 2: Verify the build still passes**

```bash
nx run mockingbird:build --skip-nx-cache 2>&1 | tail -20
```

Expected: build succeeds (no env validation errors).

**Step 3: Commit**

```bash
git add apps/mockingbird/env.ts
git commit -m "feat(MOC-83): register MAINTENANCE_MODE env var"
```

---

## Task 2: Write failing middleware tests

**Files:**
- Create: `apps/mockingbird/__tests__/middleware.spec.ts`

The middleware reads `process.env.MAINTENANCE_MODE` and responds based on the request path. Test the routing logic by mocking `next/server` responses and constructing minimal request objects.

**Step 1: Create the test file**

```ts
// apps/mockingbird/__tests__/middleware.spec.ts

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
```

**Step 2: Run tests to verify they fail**

```bash
nx run mockingbird:test --testFile=__tests__/middleware.spec.ts --skip-nx-cache
```

Expected: FAIL — `Cannot find module '../middleware'`

---

## Task 3: Create middleware.ts

**Files:**
- Create: `apps/mockingbird/middleware.ts`

**Step 1: Create the middleware**

```ts
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
```

**Step 2: Run tests to verify they pass**

```bash
nx run mockingbird:test --testFile=__tests__/middleware.spec.ts --skip-nx-cache
```

Expected: all tests PASS.

**Step 3: Run full test suite to check for regressions**

```bash
nx run mockingbird:test --skip-nx-cache
```

Expected: all tests pass.

**Step 4: Commit**

```bash
git add apps/mockingbird/__tests__/middleware.spec.ts apps/mockingbird/middleware.ts
git commit -m "feat(MOC-83): add maintenance mode middleware with tests"
```

---

## Task 4: Create maintenance page

**Files:**
- Create: `apps/mockingbird/src/app/maintenance/layout.tsx`
- Create: `apps/mockingbird/src/app/maintenance/page.tsx`

The maintenance page lives outside any authenticated route group so it's always accessible. It reuses `AuthShell` for consistent brand styling.

**Step 1: Create layout.tsx**

```tsx
// apps/mockingbird/src/app/maintenance/layout.tsx
import { AuthShell } from '@/app/auth/_components/AuthShell';

export default function MaintenanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthShell>{children}</AuthShell>;
}
```

**Step 2: Create page.tsx**

```tsx
// apps/mockingbird/src/app/maintenance/page.tsx
import { WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

export default function MaintenancePage() {
  return (
    <div className="flex flex-col gap-6 items-center">
      <Image
        src="/images/mockingbird-logo.png"
        alt="Mockingbird"
        width={96}
        height={96}
        className="object-contain"
        priority
      />

      <div className="w-full">
        <h1 className="text-2xl font-bold tracking-tight text-base-content">
          Down for Maintenance
        </h1>
        <p className="text-sm text-base-content/60 mt-1">
          We'll be back shortly
        </p>
      </div>

      <div role="alert" className="alert alert-warning w-full">
        <WrenchScrewdriverIcon className="h-5 w-5 shrink-0" />
        <span className="text-sm">
          Mockingbird is currently undergoing scheduled maintenance.
          Please check back soon.
        </span>
      </div>
    </div>
  );
}
```

**Step 3: Verify TypeScript compiles**

```bash
nx run mockingbird:build --skip-nx-cache 2>&1 | tail -20
```

Expected: build succeeds.

**Step 4: Commit**

```bash
git add apps/mockingbird/src/app/maintenance/layout.tsx apps/mockingbird/src/app/maintenance/page.tsx
git commit -m "feat(MOC-83): add maintenance page UI"
```

---

## Task 5: Manual end-to-end verification

**Goal:** Confirm the full feature works in dev before marking complete.

**Step 1: Add MAINTENANCE_MODE to local env**

In `apps/mockingbird/.env.local`, add:

```
MAINTENANCE_MODE=true
```

**Step 2: Start the dev server**

```bash
nx run mockingbird:dev
```

**Step 3: Verify each scenario in browser / curl**

| Request | Expected |
|---------|----------|
| `http://localhost:3000/feed` | Redirects to `/maintenance` page with logo + warning alert |
| `http://localhost:3000/auth/signin` | Redirects to `/maintenance` |
| `http://localhost:3000/maintenance` | Renders maintenance page (no redirect loop) |
| `curl http://localhost:3000/api/posts` | `503` JSON `{ error: "Service temporarily..." }` |
| `curl http://localhost:3000/api/health` | `200` JSON `{ status: "maintenance" }` |

**Step 4: Remove MAINTENANCE_MODE from .env.local**

Delete the `MAINTENANCE_MODE=true` line, restart dev server, verify normal app behavior is restored.

**Step 5: Commit (if any fixes were made during verification)**

```bash
git add -p
git commit -m "fix(MOC-83): <describe fix>"
```

---

## SDLC Runbook (for reference in PR description)

```bash
# 1. Enable maintenance mode
vercel env add MAINTENANCE_MODE production   # enter: true

# 2. Trigger production deploy + run migrations

# 3. Disable maintenance mode
vercel env rm MAINTENANCE_MODE production
vercel redeploy --prod
```
