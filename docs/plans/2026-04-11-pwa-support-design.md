# PWA Support Design — Mockingbird

**Date:** 2026-04-11  
**Branch:** MOC-88-Support-PWA-installation  
**Scope:** Install-only PWA (no offline caching of content; simple offline fallback page)

---

## Context

Mockingbird is a Next.js 16 / React 19 social app with zero PWA infrastructure today. Users want to install the app on mobile devices and desktops for a native-ish feel. The requirement is install-only: the app requires internet to function, but shows a clean offline page when there's no connection.

Approach: native Next.js — no third-party PWA packages. For install-only mode, Workbox/next-pwa is overkill. A manifest route, metadata, a hand-written service worker, and generated icons are sufficient.

---

## Architecture

Purely additive — no existing files are restructured.

### New Files

| File | Purpose |
|------|---------|
| `apps/mockingbird/src/app/manifest.ts` | Next.js App Router manifest route (served at `/manifest.webmanifest`) |
| `apps/mockingbird/public/sw.js` | Hand-written service worker — caches `/offline`, serves it on navigation failure |
| `apps/mockingbird/src/app/offline/page.tsx` | Server component — offline fallback UI |
| `apps/mockingbird/src/app/offline/RetryButton.client.tsx` | Client component — "Try again" reload button |
| `apps/mockingbird/src/app/_components/ServiceWorkerRegistration.client.tsx` | Client component — registers `sw.js` on mount |
| `apps/mockingbird/scripts/generate-pwa-icons.mjs` | One-time icon generation script using `sharp` |
| `apps/mockingbird/public/icons/icon-192.png` | 192×192 icon (generated) |
| `apps/mockingbird/public/icons/icon-512.png` | 512×512 icon (generated) |
| `apps/mockingbird/public/icons/icon-maskable-512.png` | 512×512 maskable icon with padding (generated) |
| `apps/mockingbird/public/icons/apple-touch-icon.png` | 180×180 iOS home screen icon (generated) |

### Modified Files

| File | Change |
|------|--------|
| `apps/mockingbird/src/app/layout.tsx` | Add `metadata` export + `viewport` export + `<ServiceWorkerRegistration />` component |
| `apps/mockingbird/src/app/global.css` | Add `padding-top: env(safe-area-inset-top)` to body/app shell for `black-translucent` status bar |
| `apps/mockingbird/next.config.js` | Add `headers()` to serve `sw.js` with `Service-Worker-Allowed: /` header |

---

## Manifest

`apps/mockingbird/src/app/manifest.ts`:

```ts
import type { MetadataRoute } from 'next'

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
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
```

---

## Metadata & Viewport (layout.tsx)

```ts
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
}

export const viewport: Viewport = {
  themeColor: '#F49D37',
}
```

The `<ServiceWorkerRegistration />` component is rendered inside `<body>` — it has no visible output, just registers `sw.js` on mount.

---

## Service Worker (`public/sw.js`)

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
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
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

Only intercepts navigation requests. All other requests (API, assets) pass through untouched.

---

## Safe Area (global.css)

For `black-translucent` status bar on iOS, content must avoid the status bar area:

```css
body {
  padding-top: env(safe-area-inset-top);
}
```

Also add `<meta name="viewport" content="viewport-fit=cover">` via the `viewport` export:

```ts
export const viewport: Viewport = {
  themeColor: '#F49D37',
  viewportFit: 'cover',
}
```

---

## Offline Page

`apps/mockingbird/src/app/offline/page.tsx` — server component:
- Mockingbird logo centered
- "You're offline" heading
- Short message: "Check your connection and try again."
- `<RetryButton />` client component with `window.location.reload()`
- Styled with Tailwind + DaisyUI to match the rest of the app

---

## Icon Generation Script

Run once: `node apps/mockingbird/scripts/generate-pwa-icons.mjs`

Uses `sharp` (already a project dependency at root level) to resize `public/images/mockingbird-logo.png`:

| Output | Size | Notes |
|--------|------|-------|
| `public/icons/icon-192.png` | 192×192 | Standard Android |
| `public/icons/icon-512.png` | 512×512 | Android splash/install |
| `public/icons/icon-maskable-512.png` | 512×512 | ~10% padding for maskable safe zone |
| `public/icons/apple-touch-icon.png` | 180×180 | iOS home screen |

Generated files are committed to the repo (not in `.gitignore`).

---

## next.config.js Header

```js
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
```

---

## Verification

1. Run icon generation script: `node apps/mockingbird/scripts/generate-pwa-icons.mjs` — verify 4 files appear in `public/icons/`
2. Start dev server: `nx run mockingbird:dev`
3. Open Chrome DevTools → Application → Manifest — verify manifest loads with correct name, icons, theme color
4. Application → Service Workers — verify `sw.js` is registered and activated
5. Lighthouse → PWA audit — should pass installability checks
6. In Chrome, look for install prompt in address bar (or use "Add to Home Screen" on mobile)
7. Install the app — verify it opens in standalone mode (no browser chrome)
8. Disconnect network, navigate to a new URL — verify `/offline` page appears
9. On iOS Safari: Add to Home Screen — verify `black-translucent` status bar (content fills under status bar)
10. Production build: `nx run mockingbird:build` — verify no build errors
