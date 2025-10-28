# Mockingbird Architecture Documentation

## Overview

Mockingbird is a full-stack social media application built with modern web technologies. It's a monorepo managed with Nx that combines a Next.js frontend with TypeScript, featuring user authentication, image management, and social features like posts and friend connections.

## Application Type & Framework

- **Primary Framework**: Next.js 15.1.4 (App Router)
- **Runtime**: Node.js
- **Language**: TypeScript 5.5.4
- **Frontend Framework**: React 19.0.0
- **Styling**: Tailwind CSS 3.4.3 + DaisyUI 4.12.10
- **Build System**: Nx 19.8.4 (Monorepo)
- **Deployment**: Vercel (with Docker support)
- **Database**: CockroachDB (via Prisma)

## Monorepo Structure

The project is organized as an Nx monorepo with the following key directories:

```
mockingbird/
├── apps/
│   ├── mockingbird/              # Main Next.js application
│   └── mockingbird-e2e/          # Playwright end-to-end tests
├── stoyponents/                  # Shared UI component library
├── tools/
│   └── stoy-plugin/              # Custom Nx plugin
├── nx.json                        # Nx configuration
├── package.json                   # Root workspace dependencies
└── tsconfig.base.json            # Base TypeScript configuration
```

### Path Aliases (tsconfig.base.json)
- `@mockingbird/stoyponents`: Shared component library
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
│   ├── profile/
│   ├── friends/
│   ├── feed/
│   └── test/
├── api/                          # RESTful API endpoints
│   ├── auth/[...nextauth]/       # NextAuth route handler
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
Helper functions for common operations
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
  └── sessions: Session[]  (NextAuth sessions)

Post
  ├── poster: User
  ├── responseTo: Post? (for replies/comments)
  ├── responses: Post[] (comments on this post)
  ├── image: Image? (optional image attachment)
  └── audience: Audience (PUBLIC | PRIVATE)

Image
  ├── owner: User
  ├── album: Album? (optional grouping)
  └── posts: Post[] (referenced by posts)

Album
  ├── owner: User
  └── images: Image[]

Friends
  ├── user: User (requester)
  └── accepted: Boolean (status of friendship)

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
- **Cascade Deletes**: Posts, Friends, and Images cascade delete with their owner
- **Optional Relations**: Images and Responses are optional
- **Audience Control**: Posts have PUBLIC/PRIVATE audience for access control
- **Versioned Documents**: Legal documents have version tracking
- **Soft Relationships**: Friends model stores user IDs with acceptance flag

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

### Architecture
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
- Image validation includes size checks before upload

## API Architecture

### RESTful Endpoints

#### Posts
- `POST /api/posts` - Create new post (requires authentication)
- `GET /api/posts/[postId]` - Get post details
- `DELETE /api/posts/[postId]` - Delete post

#### Comments/Replies
- `GET /api/posts/[postId]/comments` - List comments on post
- `POST /api/posts/[postId]/comments` - Add comment to post

#### Users
- `GET /api/users` - Get all users
- `GET /api/users/[userId]` - Get user profile
- `PUT /api/users/[userId]` - Update user profile

#### User Images
- `GET /api/users/[userId]/images` - List user's images
- `POST /api/users/[userId]/images` - Upload image
- `DELETE /api/images/[imageId]` - Delete specific image

#### Feed
- `GET /api/users/[userId]/feed` - Get personalized feed

#### Friends
- `GET /api/users/[userId]/friends` - List friends
- `POST /api/users/[userId]/friends` - Send friend request
- `PUT /api/users/[userId]/friends/[friendId]` - Accept/reject request
- `DELETE /api/users/[userId]/friends/[friendId]` - Remove friend

#### Documents
- `GET /api/documents/[docType]/latest` - Get latest legal document
- `GET /api/documents/[docType]/[version]` - Get specific version
- `POST /api/documents/[docType]` - Create new document

### Error Handling
- **Centralized**: `api/errors.ts` with `ResponseError` class
- **Validation**: Zod schemas validate request/response data
- **Status Codes**: 400 (validation), 401 (auth), 403 (forbidden), 404 (not found), 500 (server)

### Authentication Guard
- `validateAuthentication()`: Checks NextAuth session
- Throws error if unauthenticated
- Returns session with user ID for authorization checks

## Shared Libraries

### stoyponents Library
Reusable UI component library with four main modules:

1. **Dialog Components** (`dialog/`)
   - `DialogBase.tsx`: Base dialog structure with header, body, actions
   - `ConfirmationDialog.client.tsx`: Generic confirmation dialogs
   - `ConfirmSignOutDialog.client.tsx`: Sign-out confirmation

2. **Form Components** (`form/`)
   - `FormTextInput.tsx`: Styled text input with validation
   - `FormError.tsx`: Error message display

3. **Menu Components** (`menu/`)
   - `MenuButton.tsx`: Dropdown menu container
   - `MenuItem.tsx`: Individual menu items

4. **Editor Components** (`editor/`)
   - Rich text editing components for post creation
   - Quill-based rich text editor

### stoy-plugin
Custom Nx plugin for tooling and build automation

## Key Dependencies & Libraries

### Frontend
- **react-hook-form**: Form state management
- **@hookform/resolvers**: Form validation resolver
- **zod**: Runtime type validation
- **zustand**: Client-side state management
- **react-markdown**: Markdown rendering
- **react-quilljs**: Rich text editor
- **@heroicons/react**: Icon library

### Backend/Services
- **@prisma/client**: ORM and database client
- **next-auth**: Authentication framework
- **@auth/prisma-adapter**: NextAuth Prisma adapter
- **@aws-sdk/client-s3**: AWS SDK for R2 storage
- **sharp**: Image processing and optimization
- **bcryptjs**: Password hashing
- **winston**: Structured logging
- **sanitize-html**: HTML sanitization
- **@t3-oss/env-nextjs**: Environment validation

### Development
- **@nx/next**: Nx Next.js plugin
- **@nx/react**: Nx React library support
- **@nx/jest**: Jest test runner
- **@nx/playwright**: Playwright E2E testing
- **@testing-library/react**: React component testing
- **typescript**: Type safety
- **tailwindcss**: Utility-first CSS

## Architectural Patterns & Decisions

### 1. Server Components by Default
- React 19 with Next.js 15 uses Server Components by default
- Only child components explicitly marked with `.client.tsx` or "use client" directive are client-side
- Reduces JavaScript bundle size and enables server-side data fetching

### 2. API Layer Separation
- **Client-side API calls** in `_apiServices/` use `fetch()` wrappers
- **Server-side business logic** in `_server/` services
- **API routes** in `app/api/` handle HTTP requests
- Clear separation of concerns

### 3. Type Safety
- **Zod schemas** for runtime validation of all inputs/outputs
- **Branded types** for IDs (PostId, UserId, etc.) prevent accidental mixups
- **TypeScript strict mode** enforces type safety

### 4. Monorepo with Nx
- Centralized dependencies at root level
- Shared TypeScript configuration
- Reusable libraries (stoyponents)
- Consistent tooling and building

### 5. Environment Validation
- **@t3-oss/env-nextjs** with Zod schemas
- Validates all env vars at build time
- Separate server and client schemas
- Prevents runtime errors from missing config

### 6. Authentication Strategy
- **JWT-based sessions** for scalability (stateless)
- **Prisma adapter** for persistent session storage
- **NextAuth middleware** for request-level authorization
- **OAuth providers** for third-party auth without password storage

### 7. Image Management
- **Cloudflare R2** for cost-effective, distributed object storage
- **Sharp** for server-side image optimization
- **Automatic thumbnails** generated during upload
- **CDN-backed URLs** for fast image serving

### 8. Logging & Observability
- **Winston** with daily-rotate-file transport
- **Structured JSON logs** for parsing
- **Environment-based log levels** (verbose in dev, errors only in prod)
- **Child loggers** for service-level context

### 9. Audience Control
- **ENUM-based audience** (PUBLIC or PRIVATE)
- Enables future feed filtering logic
- Database-enforced access control

### 10. Data Validation at Every Layer
- **Client**: react-hook-form with resolver
- **API route**: Zod schema parsing
- **Service**: Additional business logic validation
- **Database**: Prisma schema constraints

## Development Environment

### Environment Variables
Required server-side variables in `env.ts`:
- `DATABASE_URL`: CockroachDB connection string
- `AUTH_SECRET`: JWT signing secret
- `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`: GitHub OAuth
- `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`: Google OAuth
- `CLOUDFLARE_*`: R2 storage credentials
- `IMAGES_BASE_URL`: CDN URL for images
- `TURNSTILE_*`: Cloudflare Turnstile CAPTCHA keys
- `LOG_LEVEL`, `LOG_DIR`: Logging configuration

### Scripts (from package.json)
Root workspace dependencies and Nx-managed build targets

### Testing
- **Jest** for unit tests in `__tests__/` directories
- **Playwright** for E2E tests in `mockingbird-e2e` app
- Service-level tests in `_server/__tests__/`
- Type tests with TypeScript `satisfies` operator

## Deployment

### Vercel
- Primary deployment platform
- Next.js first-class support
- Environment variables configured in project settings
- Automatic deployments from git branches

### Docker
- `Dockerfile` for containerized deployment
- `docker-compose.yaml` for local dev environment
- Image optimization with `NEXT_SHARP_PATH` for production builds

### Database Migrations
- `migrations.json` tracks Prisma migrations
- CockroachDB compatibility layer handled by Prisma

## Summary

Mockingbird is a well-architected, modern social media platform emphasizing:
- **Type safety** through TypeScript and Zod
- **Scalability** via Next.js 15, JWT sessions, and serverless functions
- **Component reusability** with shared stoyponents library
- **Developer experience** with Nx monorepo structure
- **Security** through NextAuth, CORS, and bcrypt password hashing
- **Performance** via Server Components, image optimization, and CDN storage
- **Observability** through Winston structured logging

