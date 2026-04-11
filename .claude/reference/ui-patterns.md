# UI Patterns Reference

## Component Naming Conventions

| Suffix | Type | Rules |
|---|---|---|
| `.tsx` | Server Component | Async OK; can call services directly; can call `auth()` |
| `.client.tsx` | Client Component | **Must** have `"use client"` as the **first line** of the file |
| `Skeleton*.tsx` | Loading placeholder | Used as Suspense fallback; mirrors the real component's DOM structure with DaisyUI `skeleton` class |

All shared components live in `src/_components/`. Route-local components live in a `_components/` subdirectory under the route directory.

---

## Route Group Structure

```
src/app/
├── (routes)/           # Authenticated app pages (Header + Footer layout)
│   ├── layout.tsx      # Wraps children in Header + max-w-2xl container + Footer
│   ├── page.tsx        # Home / feed page
│   ├── post/[postId]/  # Post detail page
│   ├── profile/        # User profile + change password
│   ├── friends/        # Friends management
│   └── test/           # Debug/test pages
├── (admin)/
│   └── admin/          # Admin panel (sidebar layout, permission-gated)
│       ├── layout.tsx  # Admin sidebar nav layout
│       ├── page.tsx    # Dashboard
│       ├── users/      # User management
│       ├── content/    # Post moderation
│       ├── documents/  # Legal document management
│       ├── logs/       # System log viewer
│       └── audit/      # Admin audit log
├── auth/               # Auth flow pages (no shared layout)
│   ├── signin/
│   ├── create-account/
│   ├── tos/
│   ├── forgot-password/
│   ├── reset-password/
│   ├── expired-password/
│   └── verify-email/
├── api/                # API route handlers
├── layout.tsx          # Root layout (SessionProvider + AppErrorBoundary + DialogManager)
└── global.css
```

---

## Session Access by Context

### Server Components & API Routes
```ts
// Option 1: raw NextAuth session (use in API routes + root layout)
import { auth } from '@/app/auth';
const session = await auth(); // Session | null

// Option 2: typed SessionUser (use in server components)
import { sessionUser } from '@/_hooks/sessionUser';
const user = await sessionUser(); // SessionUser | undefined
```

### Client Components
```ts
import { useSessionUser } from '@/_hooks/useSessionUser';
const user = useSessionUser(); // SessionUser | undefined
```

**Never** import `auth` from `@/app/auth` in a client component — it's a server-only function.

`SessionUser` type:
```ts
{
  id: UserId,
  name: string,
  email: EmailAddress,
  image?: string,
  permissions: string[],
  status: UserStatus,
  requiresTOS: boolean,
}
```

---

## Next.js 15 Async Params

In Next.js 15, route params and search params are `Promise<{...}>`. Always `await` them:

```ts
// Page component
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { userId } = await params;
  const { q } = await searchParams;
  // ...
}
```

Never destructure params directly without awaiting — it will be a Promise, not the value.

---

## Suspense + Loading Pattern

Standard pattern used throughout the app:

```tsx
// Server Component page
export default async function FeedPage() {
  return (
    <Suspense fallback={<SkeletonSummaryPost />}>
      <FeedList />  {/* async Server Component */}
    </Suspense>
  );
}
```

Rules:
- Every async Server Component that renders in a list or feed **should** have a corresponding `Skeleton*.tsx`
- Skeletons use DaisyUI `skeleton` CSS class on placeholder elements
- Multiple skeletons can be shown: `Array.from({ length: 3 }).map((_, i) => <SkeletonFoo key={i} />)`

---

## Client-Side API Calls

All client-side fetches go through `fetchFromServer` from `@/_apiServices/fetchFromServer`:

```ts
import { fetchFromServer } from '@/_apiServices/fetchFromServer';

// GET
const response = await fetchFromServer(`/users/${userId}`);
const data = await response.json();

// POST with JSON body
const response = await fetchFromServer('/posts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
```

`fetchFromServer`:
- Prepends `/api` to the endpoint
- Attaches `credentials: 'include'`
- Throws `ResponseError(status, message)` on non-ok responses (parses `message` from response JSON)

**Never** call `fetch` directly in client components. Use the service modules in `@/_apiServices/` which wrap `fetchFromServer`.

---

## Server Component Data Fetching

Server Components call service functions directly — do **not** go through the HTTP API layer:

```ts
// In a Server Component — correct:
import { getFeed } from '@/_server/feedService';
const posts = await getFeed(userId, 'public');

// Wrong — don't do this from a server component:
const response = await fetch('/api/users/123/feed');
```

Service modules are in `src/_server/`. Each service imports `prisma` from `@/_server/db` and `baseLogger` from `@/_server/logger`.

---

## Post Component Hierarchy

```
FeedList (Server)              src/_components/FeedList.tsx
  └── SummaryPost (Server)     src/_components/SummaryPost.tsx
        ├── PostHeader (Server)               — avatar, name, date, audience badge, options menu
        ├── ImageDisplay (Client)             — lazy-loads post image by imageId
        ├── Post content (HTML rendered via react-markdown or innerHTML; URLs are auto-linked with target="_blank" via quill-magic-url + CustomLink blot)
        ├── PostActionsFooter                 — like/dislike/comment counts
        └── CommentList (Server)             src/_components/CommentList.tsx
              └── Comment (Server)           src/_components/Comment.tsx
                    └── CommentReplyContainer (Client) — reply input + nested reply list
```

---

## Forms

Forms use `react-hook-form` with Zod validation via `@hookform/resolvers/zod`:

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreatePostDataSchema, type CreatePost } from '@/_types';

const form = useForm<CreatePost>({
  resolver: zodResolver(CreatePostDataSchema),
});
```

Form UI components from `@mockingbird/stoyponents`:
- `FormTextInput` — labeled input with error display
- `FormError` — standalone error message

---

## Dialogs

Use `DialogBase` from `@mockingbird/stoyponents`. The app has a global `DialogManager` (rendered in root layout) that manages dialog state via Zustand.

```tsx
import { DialogBase } from '@mockingbird/stoyponents';
import { ConfirmationDialog } from '@mockingbird/stoyponents';
```

---

## DaisyUI Conventions

- **Cards**: `<div className="card bg-base-100 shadow-xl"><div className="card-body">...</div></div>`
- **Buttons**: `btn btn-primary`, `btn btn-ghost`, `btn btn-error`, etc.
- **Badges**: `badge badge-neutral`, `badge badge-warning` (for roles/statuses)
- **Loading**: `<span className="loading loading-spinner loading-sm" />`
- **Skeleton**: `<div className="skeleton h-4 w-full" />`
- **Lists**: `<ul className="list">`, `<li className="list-row">` for structured list items

Theme: `bg-neutral` is the app background; `bg-base-100` is the card/content background.

---

## Admin Pages

Admin pages are Server Components that:
1. Call `validatePermission('some:permission')` at the top (throws 403 if missing)
2. Fetch data directly from services (not via HTTP)
3. Use the admin layout's sidebar nav

Admin client components live in `_components/` subdirectories under each admin section (e.g., `(admin)/admin/users/_components/UserAdminControls.client.tsx`).

---

## Error Handling

- **API routes**: All handlers are wrapped in try/catch returning `respondWithError(error)` from `api/errors.ts`
- **Client components**: Catch `ResponseError` from `fetchFromServer`; display user-facing messages
- **Server components**: Errors bubble to the nearest Next.js error boundary or `error.tsx`
- **Root layout**: `AppErrorBoundary.client.tsx` wraps the entire app as a fallback

---

## Import Path Aliases

| Alias | Resolves to |
|---|---|
| `@/_types` | `src/_types/index.ts` (re-exports all type modules) |
| `@/_server` | `src/_server/` |
| `@/_apiServices` | `src/_apiServices/` |
| `@/_components` | `src/_components/` |
| `@/_hooks` | `src/_hooks/` |
| `@/_utils` | `src/_utils/` |
| `@/app` | `src/app/` |
| `@mockingbird/stoyponents` | Shared UI component library (`stoyponents/`) |
