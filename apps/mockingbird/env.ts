import { createEnv } from '@t3-oss/env-nextjs';
import { vercel } from '@t3-oss/env-nextjs/presets';
import { z } from 'zod';

export const env = createEnv({
  extends: [vercel()],
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    NODE_ENV: z.enum(['development', 'test', 'production']).optional(),

    LOG_LEVEL: z
      .enum(['error', 'warn', 'info', 'debug', 'trace'])
      .default('info'),
    LOG_DIR: z.string().default('./logs'),

    // Database (Supabase PostgreSQL)
    DATABASE_URL: z.string().url(),
    DIRECT_URL: z.string().url(), // Direct connection for Prisma migrations

    // Supabase Auth & API
    SUPABASE_URL: z.string().url(),
    SUPABASE_ANON_KEY: z.string().min(1),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

    API_HOST: z.string().url().optional(),
    API_PATH: z.string().min(1),

    NEXT_SHARP_PATH: z.string().optional(),

    // GitHub OAuth (for Supabase Auth)
    AUTH_GITHUB_ID: z.string().min(1),
    AUTH_GITHUB_SECRET: z.string().min(1),

    // Cloudflare Turnstile
    TURNSTILE_SITE_KEY: z.string().min(1),
    TURNSTILE_SECRET_KEY: z.string().min(1),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  // runtimeEnv: {
  //   NODE_ENV: process.env.NODE_ENV,
  //   AUTH_SECRET: process.env.AUTH_SECRET,
  //   AUTH_GITHUB_ID: process.env.AUTH_GITHUB_ID,
  //   AUTH_GITHUB_SECRET: process.env.AUTH_GITHUB_SECRET,
  // },
  experimental__runtimeEnv: process.env as unknown as Record<
    'NEXT_PUBLIC_SUPABASE_URL' | 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    string | number | boolean | undefined
  >,

  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
   * This is especially useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
