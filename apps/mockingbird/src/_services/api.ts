'use server';

import { env } from '@/../env.mjs';

export async function apiUrlFor(path: string) {
  const API_HOST = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : env.API_HOST; // ex: 'http://localhost:3000';
  const API_PATH = env.API_PATH; // ex: '/api';

  return `${API_HOST}${API_PATH}${path}`;
}
