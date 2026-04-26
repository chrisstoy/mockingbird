# Mockingbird Architecture Documentation

## Overview

Mockingbird is a full-stack social media application built with modern web technologies. It's a monorepo managed with Nx that combines a Next.js frontend with TypeScript, featuring user authentication, image management, and social features like posts and friend connections.

## Application Type & Framework

- **Primary Framework**: Next.js 15.1.4 (App Router)
- **Runtime**: Node.js
- **Language**: TypeScript 5.5.4
- **Frontend Framework**: React 19.0.0
- **Styling**: Tailwind CSS 4.1 + DaisyUI 5.5
- **Build System**: Nx 20+ (Monorepo)
- **Deployment**: Vercel (with Docker support)
- **Database**: CockroachDB (via Prisma 7)
- **ORM**: Prisma 7 — no `url` in `datasource` block; DB config lives in `apps/mockingbird/prisma.config.ts`

## Monorepo Structure

```
mockingbird/
├── apps/
│   ├── mockingbird/              # Main Next.js application
│   └── mockingbird-e2e/          # Playwright end-to-end tests
├── tools/
│   └── stoy-plugin/              # Custom Nx plugin (build automation)
├── nx.json                        # Nx configuration
├── package.json                   # Root workspace dependencies
└── tsconfig.base.json            # Base TypeScript configuration
```

### Path Aliases (tsconfig.base.json)

- `@mockingbird/stoy-plugin`: Custom build tools

## Directory Structure: apps/mockingbird

### Root Configuration Files

- **next.config.js**: Next.js configuration with Nx plugin, image optimization settings
- **env.ts**: Environment variable schema validation using @t3-oss/env-nextjs with Zod
- **middleware.ts**: NextAuth middleware for authentication and CORS handling
- **prisma/schema.prisma**: Database schema definition
- **tsconfig.json**: App-specific TypeScript configuration

### Source Directory (`src/`)

#### `app/` - App Router Structure

Next.js uses the App Router pattern (not Pages Router):

```
src/app/
├── (routes)/                     # Route group for authenticated pages
│   ├── page.tsx                  # Home / feed
│   ├── post/[postId]/            # Post detail
│   ├── profile/                  # User profile + change password
│   ├── friends/                  # Friends management
│   ├── privacy/                  # Privacy/TOS doc links (+ /policy, /tos sub-routes)
│   └── test/                     # Debug pages
├── (account)/                    # Route group for account state pages (no main layout)
│   └── account/suspended/        # Shown when user status = SUSPENDED
├── (admin)/                      # Route group for admin panel (sidebar layout)
│   └── admin/                    # All admin pages
├── api/                          # RESTful API endpoints
│   ├── auth/[...nextauth]/       # NextAuth route handler
│   ├── health/                   # Health check: GET /api/health
│   ├── posts/                    # Posts CRUD operations
│   ├── users/                    # User management
│   ├── images/                   # Image operations
│   ├── documents/                # Legal documents (ToS, Privacy Policy)
│   └── errors.ts                 # Centralized error handling
├── auth/                         # Authentication pages and logic
│   ├── signin/                   # Sign-in page
│   ├── tos/                      # Terms of Service acceptance
│   ├── create-account/           # Account creation
│   ├── index.ts                  # NextAuth configuration export
│   ├── auth.config.ts            # NextAuth provider configuration
│   ├── localCredentials.ts       # Local email/password provider
│   └── requireAcceptToS.ts       # TOS middleware
├── maintenance/                  # Maintenance mode page
├── offline/                      # Offline / PWA fallback page
├── manifest.ts                   # PWA web app manifest
├── layout.tsx                    # Root layout
├── not-found.tsx                 # 404 page
└── global.css                    # Global styles
```

#### `_components/` - React Components

Shared UI components following the underscore-prefix pattern for shared logic:

- Post-related: `PostView.tsx`, `SummaryPost.tsx`, `PostHeader.tsx`, `PostMenu.client.tsx`
- Comments: `Comment.tsx`, `CommentReply.client.tsx`, `CommentList.tsx`
- Image: `ImageDisplay.client.tsx`, `ImageView.client.tsx`, `SelectImageDialog.client.tsx`
- Editor: `postEditor/` directory with rich text editing components
- Navigation: `Header.tsx`, `Footer.tsx`, `UserButton.client.tsx`
- Utilities: `DialogManager.client.tsx`, `FeedSelector.client.tsx`, `AudienceSelector.client.tsx`

**Component Naming Convention**:

- `.client.tsx`: Client-side component (requires "use client" directive)
- `.tsx`: Server component by default
- Skeleton components for loading states: `SkeletonPostView.tsx`, etc.

#### `_server/` - Server-Side Logic

Backend services and database interactions:

```
_server/
├── db.ts                         # Prisma client singleton with logging config
├── logger.ts                     # Winston logging service
├── imagesService.ts              # Image upload, storage, deletion via Cloudflare R2
├── postsService.ts               # Post CRUD operations
├── friendsService.ts             # Friend request management
├── feedService.ts                # Feed generation logic
├── usersService.ts               # User management
├── documentsService.ts           # Legal document management
├── turnstileService.ts           # Cloudflare Turnstile CAPTCHA validation
├── emailService.ts               # Email sending (verification, password reset, etc.)
├── reactionService.ts            # Post reaction upsert/delete logic
├── notificationCount.ts          # Notification badge count (friend requests, future sources)
├── adminService.ts               # Admin actions + audit log helper
└── __tests__/                    # Service unit tests
```

#### `_apiServices/` - Client-Side API Calls

Fetch wrappers for making HTTP requests to API routes:

- `post.ts`: Post operations
- `images.ts`: Image upload and retrieval
- `friends.ts`: Friend operations
- `feed.ts`: Feed data fetching
- `users.ts`: User data operations
- `fetchFromServer.ts`: Base fetch utility
- `apiUrlFor.ts`: URL builder for API routes

#### `_types/` - TypeScript Type Definitions

Schema definitions using Zod for runtime validation:

- `ids.ts`: ID branded types (PostId, UserId, ImageId, etc.)
- `post.ts`: Post schema and types
- `images.ts`: Image schema and metadata
- `users.ts`: User profile types
- `audience.ts`: Post audience enum (PUBLIC, PRIVATE)
- `documents.ts`: Document types and schemas
- `createUser.ts`: New user registration schemas
- `feeds.ts`: Feed-related types
- `password.ts`: Password-related schemas
- `type-utilities.ts`: Utility types and helpers

#### `_utils/` - Utility Functions

- `toLocalTime.ts`: Timezone conversion

#### `_hooks/` - Custom React Hooks

Custom hooks for shared stateful logic

## Database Layer

### Prisma ORM

- **Provider**: CockroachDB (distributed SQL database)
- **Location**: `prisma/schema.prisma`
- **Client**: Auto-generated PrismaClient with environment-based logging

### Data Model

```
User
  ├── posts: Post[]
  ├── friends: Friends[]
  ├── accounts: Account[]  (OAuth providers)
  ├── sessions: Session[]  (NextAuth sessions)
  └── permissionOverrides: UserPermission[]

Post
  ├── poster: User
  ├── responseTo: Post? (for replies/comments)
  ├── responses: Post[] (comments on this post)
  ├── image: Image? (optional image attachment)
  ├── audience: Audience (PUBLIC | PRIVATE)
  └── reactions: PostReaction[]

PostReaction
  ├── post: Post
  ├── user: User
  └── reaction: ReactionType (THUMBS_UP | THUMBS_DOWN | CHEER | ANGER | LAUGH | HUGS)
  (composite PK: postId + userId — one reaction per user per post)

Image
  ├── owner: User (raw ownerId string — no Prisma FK relation)
  ├── album: Album? (optional grouping)
  └── posts: Post[] (referenced by posts)

Album
  ├── owner: User (raw ownerId string)
  └── images: Image[]

Friends
  ├── user: User (requester; userId has Prisma relation)
  └── status: FriendRequestStatus (PENDING | ACCEPTED | REJECTED)

Document
  ├── type: DocumentType (TOC | PRIVACY)
  ├── creator: User ID
  └── version: Int

NextAuth Tables
  ├── Account (OAuth credentials)
  ├── Session (JWT tokens)
  └── VerificationToken (email verification)
```

### Key Design Patterns

- **Cascade Deletes**: Posts, Friends, and Images cascade delete with their owner; deleting a Post also cascades to all its comments (`responses`)
- **Optional Relations**: Images and Responses are optional
- **Audience Control**: Posts have `PUBLIC`/`PRIVATE` audience. `PRIVATE` means visible only to the poster's accepted friends.
- **Versioned Documents**: Legal documents have version tracking
- **Soft Relationships**: Friends model stores user IDs with acceptance flag

### Critical Data Model Notes

- **Posts double as comments**: `Post.responseToPostId = null` means a top-level post; non-null means it's a comment on that parent post. Always filter `responseToPostId: null` when querying for feed posts (not comments).
- **Friends is asymmetric**: `userId` = requester, `friendId` = target. To find any friendship record for a user, always query with `OR: [{ userId }, { friendId }]` — never just one direction.
- **Document type for ToS is `TOC`** (not `TOS`). The `DocumentType` enum values are `TOC` and `PRIVACY`.
- **Reactions replace likeCount/dislikeCount**: `Post` has no `likeCount`/`dislikeCount` fields. Reactions are in the `PostReaction` table (composite PK: postId + userId). Six `ReactionType` values: `THUMBS_UP`, `THUMBS_DOWN`, `CHEER`, `ANGER`, `LAUGH`, `HUGS`.
- **`Passwords` table has no cascade delete** — when deleting a user, the `Passwords` row must be deleted manually before the user row.
- **`AdminAuditLog.metadata`** is `Json?` — use `Prisma.JsonNull` for null values and cast objects to `Prisma.InputJsonValue` for writes.
- **`User.acceptedToS`** stores a `DocumentId` string (the ID of the accepted ToS document), not a boolean.

### Feed Sources

`FeedSource = 'public' | 'private' | <cuid2-string>`

- `public`: all PUBLIC top-level posts from accepted friends + self, paginated with cursor
- `private`: top-level posts (public + private) from self + accepted friends, no cursor pagination
- Any other cuid2 string: **not yet implemented** — `getFeed()` will throw `Unknown feed source`

## Authentication

### NextAuth.js Configuration

- **Strategy**: JWT-based sessions with Prisma adapter
- **Base Path**: `/api/auth`
- **Session Strategy**: JWT (scalable for stateless deployments)

### Providers Configured

1. **GitHub OAuth** (`AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`)
2. **Google OAuth** (`AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`)
3. **Local Credentials** (email/password with bcryptjs)

### Auth Flow

- Users can sign in via OAuth or email/password
- NextAuth adapter stores accounts and sessions in Prisma
- JWT tokens contain user ID and access tokens from providers
- Terms of Service acceptance tracked in User.acceptedToS field

### Middleware

- **Location**: `middleware.ts`
- **Protected Routes**: All routes except `/auth`, `/api`, `/api/auth`, and static assets
- **Callback URL**: Redirects unauthenticated users to signin with callback
- **CORS**: Allows specific origins (localhost:3000, Vercel deployment URLs)

### Password Storage

- Local passwords use bcryptjs for hashing
- Stored in separate `Passwords` table with expiration

## File Storage: Cloudflare R2 + AWS S3 SDK

Mockingbird uses **Cloudflare R2** (S3-compatible object storage) for image management via AWS SDK v3.

### S3 Configuration

```
Endpoint: https://{CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com
Region: auto
Credentials: Access Key ID + Secret Access Key (Cloudflare R2)
Bucket: {CLOUDFLARE_R2_BUCKET_NAME}
```

### Image Processing

- **Sharp**: Image resizing and optimization
- **Original Storage**: Full-size images stored with UUID as key
- **Thumbnail Generation**: Automatically creates 120x120px JPEG thumbnails (80% quality)
- **Naming**: `{userId}/{uuid}.{format}` for organized storage
- **URL Base**: `IMAGES_BASE_URL` environment variable for public CDN access

### Image Service Operations (imagesService.ts)

1. **storeImageForUser()**: Upload and create thumbnail
2. **storeExternalImageForUser()**: Reference external image URL
3. **deleteImageForUser()**: Remove image and thumbnail from R2
4. **listImagesForUser()**: Retrieve user's image gallery
5. **getImage()**: Fetch image metadata from database
6. **enumerateRemoteFilesForUser()**: Paginated listing of remote objects
7. **enumerateRemoteDirectories()**: List top-level user directories

### Storage Limits

- `IMAGES_MAX_SIZE_IN_BYTES`: 2MB default maximum image size

## API Architecture

### RESTful Endpoints

#### Health
- `GET /api/health` - Health check (no auth)

#### Posts
- `POST /api/posts` - Create new post
- `GET /api/posts/[postId]` - Get post details
- `DELETE /api/posts/[postId]` - Delete post
- `GET /api/posts/[postId]/comments` - List comments
- `POST /api/posts/[postId]/comments` - Add comment
- `PUT /api/posts/[postId]/reactions` - Set/replace reaction
- `DELETE /api/posts/[postId]/reactions` - Remove reaction

#### Users
- `GET /api/users` - Search users (`?q=`)
- `POST /api/users` - Create account (no auth)
- `GET /api/users/[userId]` - Get user profile
- `PATCH /api/users/[userId]` - Update profile image
- `DELETE /api/users/[userId]` - Delete account
- `GET /api/users/[userId]/images` - List user's images
- `POST /api/users/[userId]/images` - Upload image
- `GET /api/users/[userId]/albums` - List albums (partial)
- `GET /api/users/[userId]/feed` - Get personalized feed
- `GET /api/users/[userId]/friends` - List friends
- `PUT /api/users/[userId]/friends/[friendId]` - Send friend request
- `POST /api/users/[userId]/friends/[friendId]` - Accept/reject request
- `DELETE /api/users/[userId]/friends/[friendId]` - Remove friend
- `POST /api/users/[userId]/password` - Change password
- `PUT /api/users/[userId]/tos/[tosId]` - Accept ToS

#### Images & Documents
- `DELETE /api/images/[imageId]` - Delete specific image
- `GET /api/documents/[docType]/latest` - Get latest legal document (no auth)
- `GET /api/documents/[docType]/[version]` - Get specific version
- `POST /api/documents/[docType]` - Create new document

### Error Handling

- **Centralized**: `api/errors.ts` with `ResponseError` class
- **Validation**: Zod schemas validate request/response data
- **Status Codes**: 400 (validation), 401 (auth), 403 (forbidden), 404 (not found), 500 (server)
- `validateAuthentication()`: Checks NextAuth session, returns session with user ID

## Shared Component Subdirectories

All shared UI components live in `src/_components/`. Subdirectories group related primitives:

- `dialog/`: `DialogBase.tsx`, `ConfirmationDialog.client.tsx`, `ConfirmSignOutDialog.client.tsx`, `FormDialog.client.tsx`
- `form/`: `FormTextInput.tsx`, `FormError.tsx`
- `menu/`: `MenuButton.tsx`, `MenuItem.tsx`
- `editor/`: Quill-based rich text editor components (`TextEditor`, `TextDisplay`, `FileSelectButton`)
- `postEditor/`: Post composition components

## Custom Nx Plugin

`tools/stoy-plugin/` — custom Nx plugin for build tooling and automation

## Key Dependencies

### Frontend
- **react-hook-form** + **@hookform/resolvers**: Form state/validation
- **zod**: Runtime type validation
- **zustand**: Client-side state management
- **react-markdown**: Markdown rendering
- **react-quilljs**: Rich text editor
- **@heroicons/react**: Icon library

### Backend/Services
- **@prisma/client**: ORM and database client
- **next-auth** + **@auth/prisma-adapter**: Authentication
- **@aws-sdk/client-s3**: AWS SDK for R2 storage
- **sharp**: Image processing
- **bcryptjs**: Password hashing
- **winston**: Structured logging
- **sanitize-html**: HTML sanitization
- **@t3-oss/env-nextjs**: Environment validation

## Architectural Patterns

1. **Server Components by Default**: `.tsx` = Server Component; `.client.tsx` + `"use client"` = Client Component
2. **API Layer Separation**: `_apiServices/` (client fetches) → `app/api/` (route handlers) → `_server/` (business logic)
3. **Type Safety**: Zod schemas + branded ID types (PostId, UserId, etc.) + TypeScript strict mode
4. **Environment Validation**: `@t3-oss/env-nextjs` validates all env vars at build time
5. **JWT Auth**: Stateless JWT sessions via NextAuth with Prisma adapter
6. **Image CDN**: R2 storage + Sharp thumbnails + CDN-backed URLs
7. **Structured Logging**: Winston with environment-based log levels

## Environment Variables

Required in `env.ts`:
- `DATABASE_URL`: CockroachDB connection string
- `AUTH_SECRET`: JWT signing secret
- `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`: GitHub OAuth
- `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`: Google OAuth
- `CLOUDFLARE_*`: R2 storage credentials
- `IMAGES_BASE_URL`: CDN URL for images
- `TURNSTILE_*`: Cloudflare Turnstile CAPTCHA keys
- `LOG_LEVEL`, `LOG_DIR`: Logging configuration

## Deployment

- **Vercel**: Primary platform, automatic deployments from git
- **Docker**: `Dockerfile` + `docker-compose.yaml` for local/containerized dev
- **Migrations**: `migrations.json` tracks Prisma migrations
