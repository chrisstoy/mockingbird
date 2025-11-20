'use server';

import { env } from '@/../env';

export async function getTurnstileSiteKey() {
  if (env.NODE_ENV === 'development' || env.VERCEL_ENV === 'development') {
    /** See https://developers.cloudflare.com/turnstile/troubleshooting/testing/ */
    return '1x00000000000000000000AA'; // always pass
    // return '2x00000000000000000000AA'; // always fail
    // return `3x00000000000000000000FF`; // force challenge
  }

  return env.TURNSTILE_SITE_KEY;
}
