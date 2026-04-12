# PWA Support Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** Add install-only PWA support so Mockingbird can be installed on mobile and desktop, with a clean offline fallback page when there's no connection.

**Architecture:** Native Next.js App Router — no third-party PWA packages. A `manifest.ts` route, metadata exports in `layout.tsx`, a hand-written service worker at `public/sw.js`, and a `sharp`-based icon generation script. The service worker only intercepts navigation requests and serves a cached `/offline` page on failure; all other requests pass through untouched.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind + DaisyUI, `sharp` (already installed), no new dependencies.

---

### Task 1: Generate PWA Icons

**Files:**
- Create: `apps/mockingbird/scripts/generate-pwa-icons.mjs`
- Output: `apps/mockingbird/public/icons/` (4 PNG files, committed to repo)

**Step 1: Check sharp is available**

```bash
node -e "require('sharp'); console.log('sharp ok')"
```

If it fails, find where sharp is installed:
```bash
find /Users/cstoy/dev/mockingbird/node_modules/.bin -name sharp
```

**Step 2: Create the icon generation script**

Create `apps/mockingbird/scripts/generate-pwa-icons.mjs`:

```js
import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const src = join(root, 'public/images/mockingbird-logo.png');
const outDir = join(root, 'public/icons');

await mkdir(outDir, { recursive: true });

// Standard icons — logo fills the canvas
await sharp(src).resize(192, 192).toFile(join(outDir, 'icon-192.png'));
await sharp(src).resize(512, 512).toFile(join(outDir, 'icon-512.png'));
await sharp(src).resize(180, 180).toFile(join(outDir, 'apple-touch-icon.png'));

// Maskable icon — ~80% safe zone: logo at 80% size, centered on white bg
const size = 512;
const logoSize = Math.round(size * 0.8);
const offset = Math.round((size - logoSize) / 2);

const logoBuffer = await sharp(src).resize(logoSize, logoSize).toBuffer();

await sharp({
  create: {
    width: size,
    height: size,
    channels: 4,
    background: { r: 255, g: 255, b: 255, alpha: 1 },
  },
})
  .composite([{ input: logoBuffer, top: offset, left: offset }])
  .png()
  .toFile(join(outDir, 'icon-maskable-512.png'));

console.log('Icons generated in public/icons/');
```

**Step 3: Run the script**

```bash
cd /Users/cstoy/dev/mockingbird && node apps/mockingbird/scripts/generate-pwa-icons.mjs
```

Expected output: `Icons generated in public/icons/`

Verify 4 files exist:
```bash
ls apps/mockingbird/public/icons/
# apple-touch-icon.png  icon-192.png  icon-512.png  icon-maskable-512.png
```

**Step 4: Commit**

```bash
git add apps/mockingbird/scripts/generate-pwa-icons.mjs apps/mockingbird/public/icons/
git commit -m "feat(pwa): add icon generation script and generated icons"
```

---

### Task 2: Add Web App Manifest

**Files:**
- Create: `apps/mockingbird/src/app/manifest.ts`

**Step 1: Create the manifest route**

Create `apps/mockingbird/src/app/manifest.ts`:

```ts
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mockingbird',
    short_name: 'Mockingbird',
    description: 'Mockingbird social app',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#F49D37',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
```

**Step 2: Verify manifest is served**

Start dev server (`nx run mockingbird:dev`) and navigate to `http://localhost:4200/manifest.webmanifest`.

Expected: JSON response with the manifest contents.

**Step 3: Commit**

```bash
git add apps/mockingbird/src/app/manifest.ts
git commit -m "feat(pwa): add web app manifest route"
```

---

### Task 3: Add Service Worker

**Files:**
- Create: `apps/mockingbird/public/sw.js`
- Modify: `apps/mockingbird/next.config.js`

**Step 1: Create the service worker**

Create `apps/mockingbird/public/sw.js`:

```js
const CACHE = 'offline-v1';
const OFFLINE_URL = '/offline';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.add(OFFLINE_URL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return;
  event.respondWith(
    fetch(event.request).catch(() => caches.match(OFFLINE_URL))
  );
});
```

**Step 2: Add headers to next.config.js**

Modify `apps/mockingbird/next.config.js`. Add an `async headers()` function inside `nextConfig`:

```js
const nextConfig = {
  nx: {},
  serverExternalPackages: ['pg', '@prisma/adapter-pg'],
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Service-Worker-Allowed', value: '/' },
          { key: 'Cache-Control', value: 'no-cache' },
        ],
      },
    ];
  },
  images: {
    // ... existing image config unchanged
  },
};
```

**Step 3: Commit**

```bash
git add apps/mockingbird/public/sw.js apps/mockingbird/next.config.js
git commit -m "feat(pwa): add service worker and sw.js headers config"
```

---

### Task 4: Create Service Worker Registration Component

**Files:**
- Create: `apps/mockingbird/src/app/_components/ServiceWorkerRegistration.client.tsx`

**Step 1: Create the client component**

Create `apps/mockingbird/src/app/_components/ServiceWorkerRegistration.client.tsx`:

```tsx
'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => console.error('SW registration failed:', err));
    }
  }, []);

  return null;
}
```

**Step 2: Commit**

```bash
git add apps/mockingbird/src/app/_components/ServiceWorkerRegistration.client.tsx
git commit -m "feat(pwa): add service worker registration client component"
```

---

### Task 5: Update Root Layout with Metadata, Viewport, and SW Registration

**Files:**
- Modify: `apps/mockingbird/src/app/layout.tsx`
- Modify: `apps/mockingbird/src/app/global.css`

**Step 1: Update layout.tsx**

The current layout has no `metadata` or `viewport` exports. Add them, plus the `ServiceWorkerRegistration` component.

Replace the entire contents of `apps/mockingbird/src/app/layout.tsx`:

```tsx
import { DialogManager } from '@/_components/DialogManager.client';
import { ServiceWorkerRegistration } from '@/_components/ServiceWorkerRegistration.client';
import { ThemeProvider } from '@/_providers/ThemeProvider.client';
import { auth } from '@/app/auth';
import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import { SessionProvider } from 'next-auth/react';
import { Suspense } from 'react';
import { AppErrorBoundary } from './AppErrorBoundary.client';
import './global.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Mockingbird',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Mockingbird',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#F49D37',
  viewportFit: 'cover',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en" className={manrope.variable}>
      <body className="min-h-screen bg-base-100">
        <ServiceWorkerRegistration />
        <AppErrorBoundary>
          <SessionProvider session={session}>
            <ThemeProvider>
              <div className="w-full min-h-screen bg-base-100">
                <Suspense
                  fallback={
                    <span className="loading loading-ball loading-lg"></span>
                  }
                ></Suspense>
                {children}
              </div>
              <DialogManager></DialogManager>
            </ThemeProvider>
          </SessionProvider>
        </AppErrorBoundary>
      </body>
    </html>
  );
}
```

**Step 2: Add safe-area padding to global.css**

Find the `body` rule in `apps/mockingbird/src/app/global.css`. If there isn't one, add it at the end of the file:

```css
body {
  padding-top: env(safe-area-inset-top);
}
```

This ensures content doesn't hide behind the iOS status bar when `statusBarStyle: 'black-translucent'` overlays the app.

**Step 3: Verify dev server starts cleanly**

```bash
nx run mockingbird:dev
```

Open Chrome DevTools → Application → Manifest. Expected: manifest loads with name "Mockingbird", icons, theme color `#F49D37`.

**Step 4: Commit**

```bash
git add apps/mockingbird/src/app/layout.tsx apps/mockingbird/src/app/global.css
git commit -m "feat(pwa): add PWA metadata, viewport, and safe-area padding to root layout"
```

---

### Task 6: Create Offline Page

**Files:**
- Create: `apps/mockingbird/src/app/offline/page.tsx`
- Create: `apps/mockingbird/src/app/offline/RetryButton.client.tsx`

**Step 1: Create the retry button client component**

Create `apps/mockingbird/src/app/offline/RetryButton.client.tsx`:

```tsx
'use client';

export function RetryButton() {
  return (
    <button
      className="btn btn-primary"
      onClick={() => window.location.reload()}
    >
      Try again
    </button>
  );
}
```

**Step 2: Create the offline page**

Create `apps/mockingbird/src/app/offline/page.tsx`:

```tsx
import Image from 'next/image';
import { RetryButton } from './RetryButton.client';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-base-100 flex flex-col items-center justify-center gap-6 px-4 text-center">
      <Image
        src="/images/mockingbird-logo.png"
        alt="Mockingbird"
        width={96}
        height={96}
        priority
      />
      <h1 className="text-2xl font-bold text-base-content">You're offline</h1>
      <p className="text-base-content/70 max-w-xs">
        Check your connection and try again.
      </p>
      <RetryButton />
    </div>
  );
}
```

**Step 3: Verify offline page renders**

With dev server running, navigate to `http://localhost:4200/offline`.

Expected: centered layout with logo, heading, message, and "Try again" button.

**Step 4: Commit**

```bash
git add apps/mockingbird/src/app/offline/
git commit -m "feat(pwa): add offline fallback page"
```

---

### Task 7: End-to-End Verification

**Step 1: Production build**

```bash
nx run mockingbird:build
```

Expected: build completes with no errors.

**Step 2: Lighthouse PWA audit**

In Chrome DevTools with the app running:
- Open DevTools → Lighthouse tab
- Check "Progressive Web App" category
- Run audit

Expected: passes installability checks (manifest, service worker, HTTPS or localhost).

**Step 3: Verify install prompt**

In Chrome on desktop with dev server running:
- Look for install icon in the address bar (right side)
- Click it and install the app
- Verify the app opens in a standalone window (no browser chrome) with the amber theme color

**Step 4: Verify offline fallback**

- With the app installed and open, open DevTools → Network → set to "Offline"
- Navigate to any route
- Expected: `/offline` page appears with logo, message, and "Try again" button

**Step 5: Verify service worker in DevTools**

- DevTools → Application → Service Workers
- Expected: `sw.js` is registered and status is "activated and is running"

**Step 6: Final commit if any fixes needed**

```bash
git add -p
git commit -m "fix(pwa): <description of any fixes>"
```
