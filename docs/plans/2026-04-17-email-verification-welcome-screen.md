# Email Verification Welcome Screen Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** After a user clicks the email verification link, redirect them to a welcome screen with a "Sign In" button that pre-fills their email on the sign-in page.

**Architecture:** The verify-email API route is updated to redirect to a new public `/auth/welcome` page (with email in query param) instead of `/`. The middleware allowlist gains `/auth/welcome`. The sign-in page gains optional email pre-fill via `?email=` query param.

**Tech Stack:** Next.js 15 App Router, NextAuth v5, Prisma 7, Tailwind + DaisyUI, TypeScript

---

### Task 1: Add `/auth/welcome` to the middleware public-routes allowlist

**Files:**
- Modify: `apps/mockingbird/src/app/auth/index.ts`

**Context:**
The `authorized` callback in `auth/index.ts` has a block of `||`-chained pathname checks that return `true` early (public routes). `/auth/welcome` must be added here so unauthenticated users (who opened the verification link in a new browser) can access the page without being redirected to sign-in.

**Step 1: Add the pathname check**

In `apps/mockingbird/src/app/auth/index.ts`, find the block starting with:
```typescript
if (
  request.nextUrl.pathname === '/auth/create-account' ||
```

Add `|| request.nextUrl.pathname === '/auth/welcome'` to the condition. The result should look like:
```typescript
if (
  request.nextUrl.pathname === '/auth/create-account' ||
  request.nextUrl.pathname === '/auth/forgot-password' ||
  request.nextUrl.pathname === '/auth/reset-password' ||
  request.nextUrl.pathname === '/auth/expired-password' ||
  request.nextUrl.pathname === '/auth/welcome' ||
  request.nextUrl.pathname.startsWith('/images') ||
  request.nextUrl.pathname.startsWith('/api')
) {
  return true;
}
```

**Step 2: Type-check**

```bash
npm run nx -- run mockingbird:lint
```

Expected: no new errors.

**Step 3: Commit**

```bash
git add apps/mockingbird/src/app/auth/index.ts
git commit -m "feat: add /auth/welcome to middleware public-routes allowlist"
```

---

### Task 2: Update verify-email API route to redirect to welcome page

**Files:**
- Modify: `apps/mockingbird/src/app/api/auth/verify-email/route.ts`

**Context:**
Currently the route does `prisma.user.update(...)` then redirects to `/`. We need to (a) capture the user's email from the update result, and (b) change the redirect target to `/auth/welcome?email=<encoded-email>`.

**Step 1: Update the route**

Replace the entire file content with:

```typescript
import { validateAndConsumeEmailVerificationToken } from '@/_server/usersService';
import { prisma } from '@/_server/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(
      new URL('/auth/verify-email?error=invalid', request.nextUrl)
    );
  }

  let userId: string;
  try {
    userId = await validateAndConsumeEmailVerificationToken(token);
  } catch {
    return NextResponse.redirect(
      new URL('/auth/verify-email?error=invalid', request.nextUrl)
    );
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { emailVerified: new Date(), status: 'ACTIVE' },
    select: { email: true },
  });

  const welcomeUrl = new URL('/auth/welcome', request.nextUrl);
  if (updatedUser.email) {
    welcomeUrl.searchParams.set('email', updatedUser.email);
  }

  return NextResponse.redirect(welcomeUrl);
}
```

**Step 2: Type-check**

```bash
npm run nx -- run mockingbird:lint
```

Expected: no errors.

**Step 3: Commit**

```bash
git add apps/mockingbird/src/app/api/auth/verify-email/route.ts
git commit -m "feat: redirect to welcome page after email verification"
```

---

### Task 3: Create the welcome page layout

**Files:**
- Create: `apps/mockingbird/src/app/auth/welcome/layout.tsx`

**Context:**
Every page in `src/app/auth/*/` has a `layout.tsx` that wraps content in `<AuthShell>`. This keeps the welcome page visually consistent with sign-in and create-account pages (centered card).

**Step 1: Create the layout**

Create `apps/mockingbird/src/app/auth/welcome/layout.tsx`:

```typescript
import { AuthShell } from '@/app/auth/_components/AuthShell';

export default async function WelcomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthShell>{children}</AuthShell>;
}
```

**Step 2: Commit**

```bash
git add apps/mockingbird/src/app/auth/welcome/layout.tsx
git commit -m "feat: add layout for welcome page"
```

---

### Task 4: Create the welcome page

**Files:**
- Create: `apps/mockingbird/src/app/auth/welcome/page.tsx`

**Context:**
Server component. Reads `searchParams.email`. Renders a heading, confirmation subtext, and a "Sign In" link styled as a primary button pointing to `/auth/signin?email=<email>`. If no email is present in the query param, the link still works — just goes to `/auth/signin` without pre-fill.

**Step 1: Create the page**

Create `apps/mockingbird/src/app/auth/welcome/page.tsx`:

```typescript
import Link from 'next/link';

interface Props {
  searchParams: Promise<{ email?: string }>;
}

export default async function WelcomePage({ searchParams }: Props) {
  const { email } = await searchParams;

  const signInHref = email
    ? `/auth/signin?email=${encodeURIComponent(email)}`
    : '/auth/signin';

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-base-content">
          Welcome to Mockingbird
        </h1>
        <p className="text-sm text-base-content/60 mt-1">
          Your email is verified. You&apos;re all set.
        </p>
      </div>

      <p className="text-sm text-base-content/70 leading-relaxed">
        Sign in below to get started.
      </p>

      <Link href={signInHref} className="btn btn-primary w-full">
        Sign In
      </Link>
    </div>
  );
}
```

**Step 2: Type-check**

```bash
npm run nx -- run mockingbird:lint
```

Expected: no errors.

**Step 3: Commit**

```bash
git add apps/mockingbird/src/app/auth/welcome/page.tsx
git commit -m "feat: add email verification welcome page"
```

---

### Task 5: Add email pre-fill to SignInEmailPassword component

**Files:**
- Modify: `apps/mockingbird/src/app/auth/signin/_components/SignInEmailPassword.client.tsx`

**Context:**
`SignInEmailPassword` renders the email + password form. It uses `react-hook-form`. To pre-fill the email, add an optional `defaultEmail` prop and pass it as `defaultValues` to `useForm`. This is the standard RHF pattern for pre-populated forms.

**Step 1: Update the component**

Replace the entire file content with:

```typescript
'use client';
import { PasswordSchema } from '@/_types';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormTextInput } from '@mockingbird/stoyponents';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const LoginEmailPasswordSchema = z.object({
  email: z.string().email(),
  password: PasswordSchema,
});

type LoginEmailPassword = z.infer<typeof LoginEmailPasswordSchema>;

interface Props {
  onSignIn: (email: string, password: string) => void;
  defaultEmail?: string;
}

export function SignInEmailPassword({ onSignIn, defaultEmail }: Props) {
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm<LoginEmailPassword>({
    resolver: zodResolver(LoginEmailPasswordSchema),
    defaultValues: { email: defaultEmail ?? '' },
  });

  async function handleSignIn({ email, password }: LoginEmailPassword) {
    onSignIn(email, password);
  }

  return (
    <form
      onSubmit={handleSubmit(handleSignIn)}
      className="flex flex-col gap-4"
      autoComplete="off"
    >
      <div className="flex flex-col gap-3">
        <FormTextInput
          {...register('email')}
          error={errors?.email}
          placeholder="Email address"
        />
        <FormTextInput
          {...register('password')}
          error={errors?.password}
          placeholder="Password"
          type="password"
        />
      </div>
      <button type="submit" className="btn btn-primary w-full">
        Sign In
      </button>
    </form>
  );
}
```

**Step 2: Type-check**

```bash
npm run nx -- run mockingbird:lint
```

Expected: no errors.

**Step 3: Commit**

```bash
git add apps/mockingbird/src/app/auth/signin/_components/SignInEmailPassword.client.tsx
git commit -m "feat: add defaultEmail prop to SignInEmailPassword"
```

---

### Task 6: Wire email pre-fill into SignInPage

**Files:**
- Modify: `apps/mockingbird/src/app/auth/signin/page.tsx`

**Context:**
`SignInPage` is a client component that reads `useSearchParams()`. Add a read of `searchParams.get('email')` and pass it as `defaultEmail` to `<SignInEmailPassword>`.

**Step 1: Update SignInPage**

In `apps/mockingbird/src/app/auth/signin/page.tsx`, make two changes:

1. After the existing `const callbackUrl = searchParams.get('callbackUrl') || '/';` line, add:
```typescript
const defaultEmail = searchParams.get('email') ?? undefined;
```

2. Change the `<SignInEmailPassword>` usage from:
```typescript
<SignInEmailPassword onSignIn={handleSignInWithEmailAndPassword} />
```
to:
```typescript
<SignInEmailPassword onSignIn={handleSignInWithEmailAndPassword} defaultEmail={defaultEmail} />
```

**Step 2: Type-check**

```bash
npm run nx -- run mockingbird:lint
```

Expected: no errors.

**Step 3: Commit**

```bash
git add apps/mockingbird/src/app/auth/signin/page.tsx
git commit -m "feat: pre-fill email on sign-in page from query param"
```

---

### Task 7: Smoke test the full flow

**Steps:**

1. Start the dev server:
   ```bash
   npm run nx -- run mockingbird:dev
   ```

2. Register a new account at `http://localhost:3000/auth/create-account`

3. Check the verification email — click the link

4. Confirm you land on `/auth/welcome` with the correct email in the URL

5. Confirm the page shows "Welcome to Mockingbird" and "Your email is verified. You're all set."

6. Click "Sign In" — confirm you land on `/auth/signin` with the email field pre-filled

7. Enter password and sign in — confirm you reach the main page (TOS acceptance if required, then `/`)

8. **Edge case**: Open the verification link in an incognito window (no session) — confirm welcome page still loads and sign-in works

**If anything is broken:** check the browser console and Next.js dev server output for errors.
