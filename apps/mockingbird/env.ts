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

    DATABASE_URL: z.string().url(),

    API_HOST: z.string().url().optional(),
    API_PATH: z.string().min(1),

    NEXT_SHARP_PATH: z.string().optional(),

    AUTH_SECRET:
      process.env.NODE_ENV === 'production' ||
      process.env.VERCEL_ENV === 'production'
        ? z.string().min(1)
        : z.string().min(1).optional(),

    AUTH_TRUST_HOST: z.enum(['true', 'false']).optional(),

    AUTH_GITHUB_ID: z.string().min(1),
    AUTH_GITHUB_SECRET: z.string().min(1),

    AUTH_GOOGLE_ID: z.string().min(1),
    AUTH_GOOGLE_SECRET: z.string().min(1),

    CLOUDFLARE_ACCOUNT_ID: z.string().min(1),
    CLOUDFLARE_R2_ACCESS_KEY_ID: z.string().min(1),
    CLOUDFLARE_R2_SECRET_ACCESS_KEY: z.string().min(1),
    CLOUDFLARE_R2_BUCKET_NAME: z.string().min(1),

    IMAGES_BASE_URL: z.string().url(),
    IMAGES_MAX_SIZE_IN_BYTES: z.string(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {},

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
  experimental__runtimeEnv: process.env,

  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
   * This is especially useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
