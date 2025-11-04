# Supabase OAuth Configuration

This document describes how to configure OAuth providers in your Supabase project.

## Prerequisites

- Supabase project created at https://vltjqqsbvlnzgedtrdqe.supabase.co
- OAuth credentials from GitHub and Google

## GitHub OAuth Setup

### 1. Configure in Supabase Dashboard

1. Go to https://supabase.com/dashboard/project/vltjqqsbvlnzgedtrdqe/auth/providers
2. Find "GitHub" in the list of providers
3. Enable GitHub provider
4. Enter your OAuth credentials:
   - **Client ID**: `Ov23liEH083DjRNd4MNk` (from .env.local AUTH_GITHUB_ID)
   - **Client Secret**: `bd52309182351da150c321a4bdfc912b40e2c7c4` (from .env.local AUTH_GITHUB_SECRET)
5. Note the Callback URL shown: `https://vltjqqsbvlnzgedtrdqe.supabase.co/auth/v1/callback`

### 2. Update GitHub OAuth App Settings

1. Go to your GitHub OAuth app settings (https://github.com/settings/developers)
2. Find your OAuth app
3. Update the **Authorization callback URL** to:
   ```
   https://vltjqqsbvlnzgedtrdqe.supabase.co/auth/v1/callback
   ```
4. Save changes

## Google OAuth Setup

### 1. Configure in Supabase Dashboard

1. Go to https://supabase.com/dashboard/project/vltjqqsbvlnzgedtrdqe/auth/providers
2. Find "Google" in the list of providers
3. Enable Google provider
4. Enter your OAuth credentials:
   - **Client ID**: (from your Google Cloud Console)
   - **Client Secret**: (from your Google Cloud Console)
5. Note the Callback URL shown: `https://vltjqqsbvlnzgedtrdqe.supabase.co/auth/v1/callback`

### 2. Update Google OAuth Client Settings

1. Go to Google Cloud Console: https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID
3. Add the authorized redirect URI:
   ```
   https://vltjqqsbvlnzgedtrdqe.supabase.co/auth/v1/callback
   ```
4. Save changes

## Testing OAuth Flows

### Local Development

For local development, you may need to add localhost to authorized redirect URIs:

**GitHub:**
- Add: `http://localhost:3000/auth/callback`

**Google:**
- Add: `http://localhost:3000/auth/callback`

### Testing Steps

1. Navigate to http://localhost:3000/auth/signin
2. Click "Continue with GitHub" or "Continue with Google"
3. Authorize the application
4. Verify you are redirected back to `/auth/callback`
5. Verify you are then redirected to `/feed`
6. Check that user profile was created in database

## Site URL Configuration

In Supabase dashboard > Authentication > URL Configuration:

- **Site URL**: `http://localhost:3000` (dev) or your production URL
- **Redirect URLs**:
  - `http://localhost:3000/auth/callback`
  - `https://your-production-domain.com/auth/callback`

## Current Status

✅ Auth pages created
⏳ OAuth providers need to be configured in Supabase dashboard
⏳ GitHub OAuth app callback URL needs to be updated
⏳ Google OAuth client callback URL needs to be updated
⏳ Testing required after configuration
