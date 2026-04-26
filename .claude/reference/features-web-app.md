# Web App Features

The main web app is the authenticated user-facing interface under `src/app/(routes)/` and `src/app/auth/`. Auth flow pages use `AuthShell` (split-panel layout). Authenticated pages use a 3-column layout: fixed `LeftSidebar` (w-72, desktop), scrollable main content, fixed `RightSidebar` (w-96, desktop), `MobileHeader` (mobile top bar), and `MobileBottomNav` (mobile bottom tabs).

---

## Feature Inventory

| Feature | Status | Route | Notes |
|---|---|---|---|
| Sign in page | Complete | `/auth/signin` | OAuth (GitHub, Google) + email/password; redirects to callback URL after sign in |
| Create account page | Complete | `/auth/create-account` | Name, email, password + confirm; Turnstile CAPTCHA widget; submits to `POST /api/users` |
| TOS acceptance page | Complete | `/auth/tos` | Shows latest TOC document; user must accept before accessing app |
| Email verification page | Complete | `/auth/verify-email` | Shown while pending; button to resend verification email |
| Forgot password page | Complete | `/auth/forgot-password` | Email input form; submits to `POST /api/auth/forgot-password` |
| Reset password page | Complete | `/auth/reset-password` | New password form with token from URL query param |
| Expired password page | Complete | `/auth/expired-password` | Shown when login detects expired password; requires current + new password |
| Home / feed | Complete | `/` (index) | Displays `NewPost` editor + `FeedList`; feed source controlled by `?feed=` query param |
| Feed selector | Complete | `/` | Toggle between public and private feed |
| Create post | Complete | `/` | `NewPost` component with Quill rich text editor, audience selector, image attachment; URLs auto-detected via `quill-magic-url` and rendered as `target="_blank"` links |
| Post detail page | Complete | `/post/[postId]` | Full post view + all comments; links from feed click |
| Profile page | Complete | `/profile` | Shows avatar, name, email; buttons for change picture, sign out, delete account, change password |
| Change password page | Complete | `/profile/change-password` | Current + new password form; submits to `POST /api/users/[userId]/password` |
| Change profile picture | Complete | `/profile` (inline dialog) | Opens image picker dialog; updates avatar via `PATCH /api/users/[userId]` |
| Delete account | Complete | `/profile` (confirmation dialog) | Confirmation required; submits `DELETE /api/users/[userId]`; signs out after |
| Friends page | Complete | `/friends` | Three sections: current friends, sent requests (pending), received requests; search for users |
| User search | Complete | `/friends` | Search input calls `GET /api/users?q=`; results show add-friend button |
| Send friend request | Complete | `/friends` | From search results; calls `PUT /api/users/[userId]/friends/[friendId]` |
| Accept friend request | Complete | `/friends` | From received requests list; calls `POST` with `{ accepted: true }` |
| Reject friend request | Complete | `/friends` | From received requests list; calls `POST` with `{ accepted: false }` |
| Remove friend | Complete | `/friends` | From current friends list; calls `DELETE /api/users/[userId]/friends/[friendId]` |
| Account suspended page | Complete | `/account/suspended` | In `(account)` route group (no main app layout); shown when middleware detects `status = SUSPENDED`; displays suspension reason |
| Privacy / docs hub | Complete | `/privacy` | Links to `/privacy/policy` and `/privacy/tos` |
| Privacy policy viewer | Complete | `/privacy/policy` | Renders latest PRIVACY document |
| Terms of Service viewer | Complete | `/privacy/tos` | Renders latest TOC document |
| Post reactions | Complete | Feed, post detail, comments | `ReactionsBar.client.tsx` — 6 emoji buttons (👍👎🎉😠😂🤗) below post content; one reaction per user; click to set/toggle off; auto-replaces previous reaction; shows reactor names in tooltip; optimistic UI |

---

## Page Structure

### Auth Flow Pages (`src/app/auth/`)
Use `AuthShell` component (`auth/_components/AuthShell.tsx`) — split panel: dark brand sidebar (mobile: top strip, desktop: left column) + white form area on right.

| Route | Component file |
|---|---|
| `/auth/signin` | `auth/signin/page.tsx` |
| `/auth/create-account` | `auth/create-account/page.tsx` |
| `/auth/tos` | `auth/tos/page.tsx` |
| `/auth/verify-email` | `auth/verify-email/page.tsx` |
| `/auth/forgot-password` | `auth/forgot-password/page.tsx` |
| `/auth/reset-password` | `auth/reset-password/page.tsx` |
| `/auth/expired-password` | `auth/expired-password/page.tsx` |

### Authenticated App Pages (`src/app/(routes)/`)
Wrapped by `(routes)/layout.tsx` — 3-column layout: `LeftSidebar` (fixed, desktop) + main content area (lg:ml-72 lg:mr-96, max-w-2xl mx-auto) + `RightSidebar` (fixed, desktop) + `MobileHeader` + `MobileBottomNav`.

Key layout components in `src/_components/`:
- `LeftSidebar.client.tsx` — brand, nav (active state), Post button, user profile section
- `RightSidebar.tsx` — search, trending, who to follow, footer
- `AppHeader.tsx` — fixed top bar (desktop): logo, feed selector, FeedbackButton, NotificationsAlert, user avatar
- `MobileHeader.tsx` — top bar with logo, FeedbackButton, bell icon (mobile only)
- `MobileBottomNav.client.tsx` — Home/Friends/Alerts/Me tabs (mobile only)
- `FeedbackButton.client.tsx` — opens default email client pre-filled to admin@mockingbird.club with app version, user info, and browser diagnostics

| Route | Component file |
|---|---|
| `/` | `(routes)/page.tsx` |
| `/post/[postId]` | `(routes)/post/[postId]/page.tsx` |
| `/profile` | `(routes)/profile/page.tsx` |
| `/profile/change-password` | `(routes)/profile/change-password/page.tsx` |
| `/friends` | `(routes)/friends/page.tsx` |
| `/privacy` | `(routes)/privacy/page.tsx` |
| `/privacy/policy` | `(routes)/privacy/policy/page.tsx` |
| `/privacy/tos` | `(routes)/privacy/tos/page.tsx` |

### Account State Pages (`src/app/(account)/`)
No main app layout — used for account-state gates that replace the full UI.

| Route | Component file |
|---|---|
| `/account/suspended` | `(account)/account/suspended/page.tsx` |

---

## Key UI Patterns

- **FeedbackButton** (`src/_components/FeedbackButton.client.tsx`) — opens default email client pre-filled to `admin@mockingbird.club`; body includes app version, build date, user info, and browser diagnostics. Rendered left of the notification bell in both `AppHeader` and `MobileHeader`.
- **FriendAffordance** (`src/_components/FriendAffordance.client.tsx`) — inline client component rendered inside `PostHeader` when `authorId` and `friendStatus` props are provided. Shows "Add Friend" / "Pending" / "Friends" / "Rejected" state and lets the current user send or manage a friend request directly from the post/comment author header. Not shown on the current user's own posts or comments (`authorId` is omitted when `isSelf`).
- Authenticated pages are protected by `middleware.ts` — unauthenticated users are redirected to `/auth/signin?callbackUrl=`
- Suspended users are redirected to `/account/suspended` on every request
- Users without accepted TOS are redirected to `/auth/tos` on every request
- Pending email verification: users can browse but see a verification banner
- Feed uses Suspense + skeleton loading: `<Suspense fallback={<SkeletonSummaryPost />}><FeedList /></Suspense>`
- Post content rendered with react-markdown; created with Quill rich text editor
- Dialogs (confirm delete, image picker) use `DialogBase` from `@mockingbird/stoyponents`

---

## Unimplemented Stubs

| Feature | Detail |
|---|---|
| Hashtag search | Requirements mention hashtag search; no UI or search page exists |
| Post deep-linking | Requirements mention linking to an existing post; no dedicated UI beyond direct `/post/[postId]` links |
| Image albums UI | Albums exist in the data model; the image upload UI accepts `albumId` but there is no album management page |
