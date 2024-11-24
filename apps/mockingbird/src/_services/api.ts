'use server';

import { env } from '@/../env.mjs';

export async function apiUrlFor(path: string) {
  const API_HOST = env.VERCEL_URL ?? env.API_HOST;
  const API_PATH = env.API_PATH; // '/api';

  return `${API_HOST}${API_PATH}${path}`;
}
