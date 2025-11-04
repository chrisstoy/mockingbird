# Supabase Migration Plan for Mockingbird

## Migration Overview

**Goal:** Migrate Mockingbird from CockroachDB + NextAuth + Cloudflare R2 to a fully integrated Supabase stack.

### Migration Decisions

| Component | Current | Target | Notes |
|-----------|---------|--------|-------|
| **Database** | CockroachDB | Supabase PostgreSQL | Dual connection: Pooled (6543) + Direct (5432), clean database |
| **Authentication** | NextAuth.js | Supabase Auth | Full migration, remove custom Passwords table |
| **Storage** | Cloudflare R2 | Supabase Storage | Full migration, no existing images to transfer |
| **Hosting** | - | Supabase Cloud | Fully managed, hosted solution (Project: Mockingbird-dev) |
| **Schema Changes** | - | Keep as-is | Minimal changes for now |
| **Data Migration** | - | None | Start with clean database |

### Future Improvements (Not in Scope)
The following improvements are noted for future optimization:
- Add missing foreign key constraints (Passwords, Friends, Image, Album, Document → User)
- Add performance indexes (Post.posterId, Post.responseToPostId, Friends.userId/friendId, Image.ownerId)
- Implement Row Level Security (RLS) policies for database-level security
- Consider Supabase Realtime for live updates
- Evaluate Supabase Edge Functions for API routes

---

## Phase 1: Supabase Project Setup

### 1.1 Supabase Project (COMPLETED)
✅ **Project created:** Mockingbird-dev
- Project URL: `https://jvcxvpxuhslsugfpbfyb.supabase.co`
- Region: US East (Ohio)
- Status: Active

### 1.2 Connection Credentials (COMPLETED)
✅ **Credentials gathered and documented** in `design/supabase-migration-data-dev.md`

**Database Connections (Dual-URL Strategy):**
- `DATABASE_URL`: Pooled connection (Port 6543) - for queries
  - `postgresql://postgres.jvcxvpxuhslsugfpbfyb:********@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true`
- `DIRECT_URL`: Direct connection (Port 5432) - for migrations
  - `postgresql://postgres.jvcxvpxuhslsugfpbfyb:********@aws-0-us-east-1.pooler.supabase.com:5432/postgres`

**API Keys:**
- `SUPABASE_URL`: `https://jvcxvpxuhslsugfpbfyb.supabase.co`
- `SUPABASE_ANON_KEY`: (documented in credentials file)
- `SUPABASE_SERVICE_ROLE_KEY`: (documented in credentials file)

**Why Dual-URL?**
- Pooled connection (6543) via pgBouncer: Optimized for serverless, handles many concurrent requests
- Direct connection (5432): Required for Prisma migrations and certain operations
- Best practice recommended by Supabase for Next.js applications

### 1.3 Configure OAuth Providers

#### GitHub OAuth (COMPLETED)
✅ **GitHub OAuth configured** in Supabase Dashboard
1. Go to Authentication → Providers → GitHub in Supabase
2. Enable GitHub provider
3. Add your existing GitHub OAuth app credentials:
   - Client ID: (from existing `AUTH_GITHUB_ID`)
   - Client Secret: (from existing `AUTH_GITHUB_SECRET`)
4. **UPDATE your GitHub OAuth app** at https://github.com/settings/developers
   - Add callback URL: `https://jvcxvpxuhslsugfpbfyb.supabase.co/auth/v1/callback`
   - Keep existing callback URL during transition

#### Google OAuth (TODO)
⚠️ **Not configured yet** - Google OAuth is not set up in your current NextAuth
1. If you want to add Google OAuth:
   - Create Google OAuth app in Google Cloud Console
   - Enable Google provider in Supabase → Authentication → Providers
   - Add callback URL: `https://jvcxvpxuhslsugfpbfyb.supabase.co/auth/v1/callback`
2. Or skip this step if only using Email + GitHub authentication

### 1.4 Configure Email Authentication
1. Go to Authentication → Providers → Email
2. Enable email provider (for local credentials)
3. Configure email templates (optional customization)
4. Set up SMTP (or use Supabase's built-in email for development)

---

## Phase 2: Database Schema Migration

### 2.1 Update Prisma Schema

**File:** `apps/mockingbird/prisma/schema.prisma`

#### Changes Required:

1. **Update datasource with dual-URL configuration:**
   ```prisma
   datasource db {
     provider  = "postgresql"  // Changed from "cockroachdb"
     url       = env("DATABASE_URL")      // Pooled connection (port 6543)
     directUrl = env("DIRECT_URL")        // Direct connection for migrations (port 5432)
   }
   ```

   **Why directUrl?**
   - `url`: Pooled connection via pgBouncer (port 6543) - used for queries
   - `directUrl`: Direct PostgreSQL connection (port 5432) - used for migrations
   - Prisma requires direct connection for certain migration operations
   - This is the recommended Supabase + Prisma pattern

2. **Remove Passwords table** (Supabase Auth handles password storage):
   ```prisma
   // DELETE this entire model
   model Passwords {
     userId     String   @unique
     password   String
     expiresAt  DateTime
     createdAt  DateTime @default(now())
     updatedAt  DateTime @updatedAt
   }
   ```

3. **Update User model** - Remove `acceptedToS` (migrate to user metadata):
   ```prisma
   model User {
     id            String    @id @default(cuid())
     name          String
     email         String?   @unique
     emailVerified DateTime?
     image         String?
     // acceptedToS   String?  // REMOVE - will use Supabase user_metadata instead
     accounts      Account[]
     sessions      Session[]
     posts         Post[]
     friends       Friends[]
     createdAt     DateTime  @default(now())
     updatedAt     DateTime  @updatedAt
   }
   ```

4. **Keep NextAuth tables** (Account, Session, VerificationToken) for now:
   - These may not be used after Supabase Auth migration
   - Keep in schema to avoid breaking changes during transition
   - Can be removed in future cleanup phase

### 2.2 Generate New Migration

```bash
# From apps/mockingbird directory
npx prisma migrate dev --name supabase_initial_migration
```

This will:
- Generate SQL migration file
- Detect schema changes (provider, removed Passwords table, removed acceptedToS)
- Create new migration in `prisma/migrations/`

### 2.3 Apply Migration to Supabase

The migration will be applied automatically when you run `migrate dev`. Alternatively, for production:

```bash
npx prisma migrate deploy
```

### 2.4 Verify Schema

1. Go to Supabase Dashboard → Table Editor
2. Verify all tables exist:
   - User, Account, Session, VerificationToken (NextAuth tables)
   - Post, Friends, Image, Album, Document (app tables)
3. Verify enums created:
   - Audience (PUBLIC, PRIVATE)
   - DocumentType (TOC, PRIVACY)
4. Check foreign key constraints are present

---

## Phase 3: Authentication Migration

### 3.1 Install Supabase Dependencies

```bash
# From project root
npm install @supabase/supabase-js @supabase/ssr
```

### 3.2 Remove NextAuth Dependencies

```bash
npm uninstall next-auth @auth/prisma-adapter
```

### 3.3 Create Supabase Client Utilities

**File:** `apps/mockingbird/src/_server/supabase/server.ts`

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `remove` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
```

**File:** `apps/mockingbird/src/_utils/supabase/client.ts`

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**File:** `apps/mockingbird/src/_utils/supabase/middleware.ts`

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refresh session if expired
  await supabase.auth.getUser()

  return response
}
```

### 3.4 Update Middleware

**File:** `apps/mockingbird/src/middleware.ts`

Replace NextAuth middleware with Supabase session check:

```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from './_utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - /auth/* (auth pages)
     * - /api/auth/* (auth API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|auth|api/auth).*)',
  ],
}
```

### 3.5 Create Authentication Utilities

**File:** `apps/mockingbird/src/_server/auth.ts`

```typescript
import { createClient } from './supabase/server'
import { ResponseError } from '../app/api/errors'

/**
 * Validates that the user is authenticated
 * Throws ResponseError if not authenticated
 * Returns the authenticated user
 */
export async function validateAuthentication() {
  const supabase = createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new ResponseError('Unauthorized', 401)
  }

  return user
}

/**
 * Gets the current user session (nullable)
 */
export async function getSession() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}
```

### 3.6 Refactor Authentication Pages

#### Sign In Page

**File:** `apps/mockingbird/src/app/auth/signin/page.tsx`

Replace NextAuth sign-in with Supabase Auth UI or custom form:

```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  async function handleGitHubSignIn() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
    }
  }

  async function handleGoogleSignIn() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Sign In to Mockingbird</h2>

          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                placeholder="your@email.com"
                className="input input-bordered"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="input input-bordered"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="divider">OR</div>

          <div className="space-y-2">
            <button
              onClick={handleGitHubSignIn}
              className="btn btn-outline w-full"
            >
              Sign in with GitHub
            </button>

            <button
              onClick={handleGoogleSignIn}
              className="btn btn-outline w-full"
            >
              Sign in with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

#### OAuth Callback Page

**File:** `apps/mockingbird/src/app/auth/callback/route.ts`

```typescript
import { createClient } from '@/_server/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
```

#### Sign Up Page

**File:** `apps/mockingbird/src/app/auth/create-account/page.tsx`

Replace with Supabase sign-up:

```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function CreateAccountPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name, // Store name in user metadata
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else if (data.user) {
      // Create user record in database
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: data.user.id,
          email: data.user.email,
          name,
        }),
      })

      router.push('/auth/verify-email')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Create Account</h2>

          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Name</span>
              </label>
              <input
                type="text"
                placeholder="Your Name"
                className="input input-bordered"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                placeholder="your@email.com"
                className="input input-bordered"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="input input-bordered"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
```

### 3.7 Update User Button Component

**File:** `apps/mockingbird/src/_components/UserButton.client.tsx`

Replace NextAuth `signOut()` with Supabase:

```typescript
'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export function UserButton({ user }: { user: any }) {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/auth/signin')
    router.refresh()
  }

  return (
    <button onClick={handleSignOut} className="btn btn-ghost">
      Sign Out
    </button>
  )
}
```

### 3.8 Remove Old Auth Files

Delete the following files/directories:
- `apps/mockingbird/src/app/auth/auth.config.ts`
- `apps/mockingbird/src/app/auth/localCredentials.ts`
- `apps/mockingbird/src/app/auth/index.ts`
- `apps/mockingbird/src/app/auth/requireAcceptToS.ts`
- `apps/mockingbird/src/app/api/auth/[...nextauth]/route.ts`

---

## Phase 4: Storage Migration

### 4.1 Set Up Supabase Storage

1. Go to Supabase Dashboard → Storage
2. Create new bucket:
   - Name: `images`
   - Public bucket: Yes (or configure RLS for private images)
   - Allowed MIME types: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
   - File size limit: 2MB (or your preference)

3. Configure storage policies (if private bucket):
   ```sql
   -- Allow authenticated users to upload images
   CREATE POLICY "Users can upload images"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);

   -- Allow authenticated users to delete their own images
   CREATE POLICY "Users can delete own images"
   ON storage.objects FOR DELETE
   TO authenticated
   USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);

   -- Allow public to view images (or restrict as needed)
   CREATE POLICY "Public can view images"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'images');
   ```

### 4.2 Refactor imagesService.ts

**File:** `apps/mockingbird/src/_server/imagesService.ts`

Replace AWS S3 SDK with Supabase Storage:

```typescript
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'
import { prisma } from './db'
import { logger } from './logger'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for server operations
)

const BUCKET_NAME = 'images'
const MAX_SIZE = parseInt(process.env.IMAGES_MAX_SIZE_IN_BYTES || '2097152') // 2MB default

interface UploadImageParams {
  userId: string
  buffer: Buffer
  contentType: string
  description?: string
  albumId?: string
}

export async function storeImageForUser({
  userId,
  buffer,
  contentType,
  description,
  albumId,
}: UploadImageParams) {
  // Validate size
  if (buffer.length > MAX_SIZE) {
    throw new Error(`Image size exceeds maximum of ${MAX_SIZE} bytes`)
  }

  const imageId = uuidv4()
  const format = contentType.split('/')[1] || 'jpeg'
  const filename = `${userId}/${imageId}.${format}`
  const thumbnailFilename = `${userId}/${imageId}_thumb.jpeg`

  try {
    // Process original image
    const processedImage = await sharp(buffer)
      .rotate() // Auto-rotate based on EXIF
      .jpeg({ quality: 90 })
      .toBuffer()

    // Generate thumbnail
    const thumbnail = await sharp(buffer)
      .resize(120, 120, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer()

    // Upload original
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, processedImage, {
        contentType: 'image/jpeg',
        upsert: false,
      })

    if (uploadError) {
      logger.error('Failed to upload image', { error: uploadError, userId, imageId })
      throw uploadError
    }

    // Upload thumbnail
    const { error: thumbError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(thumbnailFilename, thumbnail, {
        contentType: 'image/jpeg',
        upsert: false,
      })

    if (thumbError) {
      logger.error('Failed to upload thumbnail', { error: thumbError, userId, imageId })
      // Clean up original if thumbnail fails
      await supabase.storage.from(BUCKET_NAME).remove([filename])
      throw thumbError
    }

    // Get public URLs
    const { data: imageUrl } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filename)

    const { data: thumbnailUrl } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(thumbnailFilename)

    // Create database record
    const image = await prisma.image.create({
      data: {
        id: imageId,
        ownerId: userId,
        imageUrl: imageUrl.publicUrl,
        thumbnailUrl: thumbnailUrl.publicUrl,
        description: description || '',
        albumId,
      },
    })

    logger.info('Image uploaded successfully', { userId, imageId })
    return image
  } catch (error) {
    logger.error('Failed to store image', { error, userId })
    throw error
  }
}

export async function deleteImageForUser(userId: string, imageId: string) {
  // Get image from database
  const image = await prisma.image.findUnique({
    where: { id: imageId },
  })

  if (!image) {
    throw new Error('Image not found')
  }

  if (image.ownerId !== userId) {
    throw new Error('Unauthorized to delete this image')
  }

  try {
    // Extract filenames from URLs
    const imageUrl = new URL(image.imageUrl)
    const thumbnailUrl = new URL(image.thumbnailUrl)
    const imagePath = imageUrl.pathname.split(`/${BUCKET_NAME}/`)[1]
    const thumbnailPath = thumbnailUrl.pathname.split(`/${BUCKET_NAME}/`)[1]

    // Delete from storage
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([imagePath, thumbnailPath])

    if (error) {
      logger.error('Failed to delete image from storage', { error, imageId })
      throw error
    }

    // Delete from database
    await prisma.image.delete({
      where: { id: imageId },
    })

    logger.info('Image deleted successfully', { userId, imageId })
  } catch (error) {
    logger.error('Failed to delete image', { error, userId, imageId })
    throw error
  }
}

export async function listImagesForUser(userId: string) {
  return prisma.image.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getImage(imageId: string) {
  return prisma.image.findUnique({
    where: { id: imageId },
  })
}
```

### 4.3 Update Image Upload API Route

**File:** `apps/mockingbird/src/app/api/users/[userId]/images/route.ts`

Update to use new Supabase-based imagesService (should work without changes if service interface is maintained).

### 4.4 Remove Cloudflare R2 Dependencies

```bash
npm uninstall @aws-sdk/client-s3
```

---

## Phase 5: Environment Variables Update

### 5.1 Update .env.local

**Remove:**
```env
# CockroachDB
DATABASE_URL=

# NextAuth
AUTH_SECRET=
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

# Cloudflare R2
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET_NAME=
IMAGES_BASE_URL=
```

**Add:**
```env
# Supabase Database (Dual-URL Configuration)
# Pooled connection (port 6543) - for queries
DATABASE_URL=postgresql://postgres.jvcxvpxuhslsugfpbfyb:[YOUR_PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
# Direct connection (port 5432) - for migrations
DIRECT_URL=postgresql://postgres.jvcxvpxuhslsugfpbfyb:[YOUR_PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres

# Supabase Auth & API
SUPABASE_URL=https://jvcxvpxuhslsugfpbfyb.supabase.co
SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR_SERVICE_ROLE_KEY]

# Public env vars (exposed to client)
NEXT_PUBLIC_SUPABASE_URL=https://jvcxvpxuhslsugfpbfyb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]

# Optional: Keep these if still needed
TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
LOG_LEVEL=
LOG_DIR=
```

**Note:** Replace `[YOUR_PASSWORD]`, `[YOUR_ANON_KEY]`, and `[YOUR_SERVICE_ROLE_KEY]` with actual values from `design/supabase-migration-data-dev.md`

### 5.2 Update env.ts Schema

**File:** `apps/mockingbird/env.ts`

```typescript
import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    DIRECT_URL: z.string().url(),  // Added for Prisma migrations
    SUPABASE_URL: z.string().url(),
    SUPABASE_ANON_KEY: z.string().min(1),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    TURNSTILE_SECRET_KEY: z.string().optional(),
    LOG_LEVEL: z.string().optional().default('info'),
    LOG_DIR: z.string().optional().default('./logs'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,  // Added for Prisma migrations
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
    LOG_LEVEL: process.env.LOG_LEVEL,
    LOG_DIR: process.env.LOG_DIR,
    NODE_ENV: process.env.NODE_ENV,
  },
})
```

### 5.3 Update Vercel Environment Variables

1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Delete old variables (DATABASE_URL, AUTH_*, CLOUDFLARE_*)
3. Add new Supabase variables:
   - `DATABASE_URL` (pooled connection with `?pgbouncer=true`)
   - `DIRECT_URL` (direct connection for migrations)
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Set for all environments (Production, Preview, Development)

**Important:** Use the actual values from `design/supabase-migration-data-dev.md`

---

## Phase 6: Code Refactoring

### 6.1 Update Service Files

#### usersService.ts

**Changes needed:**
- Replace `getServerSession()` with Supabase `getUser()`
- Remove Passwords table queries
- Update user creation to sync with Supabase Auth

```typescript
import { createClient } from './supabase/server'

export async function createUser(data: { id: string; email: string; name: string }) {
  // User is already created in Supabase Auth
  // Just create the database record
  return prisma.user.create({
    data: {
      id: data.id, // Use Supabase Auth user ID
      email: data.email,
      name: data.name,
    },
  })
}

export async function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
  })
}

// Remove password-related functions (handled by Supabase Auth)
```

#### postsService.ts

**Changes needed:**
- Update to use Supabase user ID format
- No major changes needed (business logic remains same)

#### API Routes

**All API routes** (`apps/mockingbird/src/app/api/**/*`):

Replace:
```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/auth'

const session = await getServerSession(authOptions)
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

With:
```typescript
import { validateAuthentication } from '@/_server/auth'

const user = await validateAuthentication()
// user.id is now available
```

### 6.2 Update Client Components

#### Remove NextAuth SessionProvider

**File:** `apps/mockingbird/src/app/layout.tsx`

Remove:
```typescript
import { SessionProvider } from 'next-auth/react'
```

Replace with Supabase context (if needed) or remove entirely (Supabase handles sessions via cookies).

#### Update Sign Out Buttons

Find all instances of:
```typescript
import { signOut } from 'next-auth/react'
```

Replace with:
```typescript
import { createClient } from '@/utils/supabase/client'

const supabase = createClient()
await supabase.auth.signOut()
```

### 6.3 Update Terms of Service Handling

Since we removed `User.acceptedToS`, migrate to Supabase user metadata:

```typescript
// When user accepts ToS
const supabase = createClient()
await supabase.auth.updateUser({
  data: {
    acceptedToS: documentId,
  },
})

// When checking ToS
const { data: { user } } = await supabase.auth.getUser()
const acceptedToS = user?.user_metadata?.acceptedToS
```

---

## Phase 7: Testing & Deployment

### 7.1 Local Testing

1. **Start development server:**
   ```bash
   npm run dev
   ```

2. **Test authentication flows:**
   - [ ] Sign up with email/password
   - [ ] Sign in with email/password
   - [ ] Sign out
   - [ ] Sign in with GitHub OAuth
   - [ ] Sign in with Google OAuth
   - [ ] Password reset flow
   - [ ] Email verification

3. **Test image operations:**
   - [ ] Upload image
   - [ ] View image
   - [ ] Delete image
   - [ ] Verify URLs work
   - [ ] Check thumbnails generated

4. **Test API endpoints:**
   - [ ] Create post
   - [ ] Get posts
   - [ ] Delete post
   - [ ] Add comment
   - [ ] Get feed
   - [ ] Friend requests
   - [ ] User profile updates

5. **Test protected routes:**
   - [ ] Verify middleware redirects unauthenticated users
   - [ ] Verify authenticated users can access routes

### 7.2 Database Verification

1. Go to Supabase Dashboard → Table Editor
2. Verify data being created:
   - [ ] User records created on sign-up
   - [ ] Post records created
   - [ ] Image records with correct URLs
   - [ ] Friend relationships

3. Check Supabase Auth dashboard:
   - [ ] Users appearing in Auth > Users
   - [ ] OAuth connections showing

### 7.3 Storage Verification

1. Go to Supabase Dashboard → Storage → images bucket
2. Verify:
   - [ ] Images uploading to correct paths (`userId/imageId.format`)
   - [ ] Thumbnails being created (`userId/imageId_thumb.jpeg`)
   - [ ] Public URLs accessible
   - [ ] File sizes within limits

### 7.4 Deploy to Vercel Staging

1. Create a preview deployment:
   ```bash
   git checkout -b supabase-migration
   git add .
   git commit -m "Migrate to Supabase (auth, database, storage)"
   git push origin supabase-migration
   ```

2. Vercel will automatically create preview deployment

3. Test all flows on preview URL

4. Monitor Vercel logs for errors

### 7.5 Production Deployment

1. Merge to main branch:
   ```bash
   git checkout main
   git merge supabase-migration
   git push origin main
   ```

2. Monitor production deployment

3. Run smoke tests on production:
   - [ ] Sign in/sign up
   - [ ] Create post
   - [ ] Upload image
   - [ ] View feed

---

## Phase 8: Cleanup

### 8.1 Remove Old Database

1. **After confirming production success** (wait 1-2 weeks):
   - Delete CockroachDB cluster
   - Cancel any subscriptions

### 8.2 Remove Old Storage

1. **After confirming all images migrated** (if applicable):
   - Delete Cloudflare R2 bucket
   - Remove API tokens

### 8.3 Archive Old Code

1. Tag the pre-migration state:
   ```bash
   git tag pre-supabase-migration
   git push origin pre-supabase-migration
   ```

2. Remove dead code:
   - Old NextAuth migration files in `prisma/migrations/`
   - Any leftover auth files

### 8.4 Update Documentation

1. Update README.md with new setup instructions
2. Update CLAUDE.md architecture documentation
3. Document new environment variables
4. Add Supabase setup guide for new developers

---

## Rollback Plan

If issues arise during migration:

### Quick Rollback (during deployment)

1. Revert environment variables in Vercel
2. Redeploy previous git commit:
   ```bash
   git revert HEAD
   git push
   ```

### Full Rollback (if needed)

1. Keep CockroachDB running during migration period (1-2 weeks)
2. Keep old environment variables saved
3. Restore from git tag:
   ```bash
   git checkout pre-supabase-migration
   git checkout -b rollback
   git push origin rollback
   ```
4. Restore environment variables
5. Redeploy

---

## Estimated Timeline

| Phase | Estimated Time | Notes |
|-------|---------------|-------|
| **Phase 1:** Supabase Setup | 1-2 hours | Account creation, OAuth config |
| **Phase 2:** Database Schema | 1 hour | Prisma changes, migration |
| **Phase 3:** Auth Migration | 4-6 hours | Most complex, many file changes |
| **Phase 4:** Storage Migration | 2-3 hours | Supabase Storage setup, code refactor |
| **Phase 5:** Environment Variables | 30 min | Update env files |
| **Phase 6:** Code Refactoring | 3-4 hours | Update services, API routes, components |
| **Phase 7:** Testing | 2-4 hours | Comprehensive testing |
| **Phase 8:** Cleanup | 1 hour | Remove old resources |
| **Total** | **15-22 hours** | Spread over 3-5 days recommended |

---

## Key Success Metrics

- [ ] All authentication flows working (email, GitHub, Google)
- [ ] All API endpoints functional
- [ ] Images uploading/deleting successfully
- [ ] No console errors in browser
- [ ] No server errors in logs
- [ ] Vercel deployment successful
- [ ] Zero downtime (clean database means no migration)

---

## Support Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth with Next.js](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [Prisma with PostgreSQL](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [Next.js App Router](https://nextjs.org/docs/app)

---

## Notes

- This migration starts with a **clean database** (no data to migrate)
- **Dual-URL configuration** used: Pooled (6543) for queries + Direct (5432) for migrations
- **Connection pooling via pgBouncer** for optimal serverless performance
- **Schema kept as-is** for minimal changes
- **Future improvements noted** (FKs, indexes, RLS) for separate task
- OAuth providers require callback URL updates in GitHub/Google consoles
- Supabase free tier limits: 500MB database, 1GB file storage, 50MB file size limit
- Actual credentials stored securely in `design/supabase-migration-data-dev.md`
