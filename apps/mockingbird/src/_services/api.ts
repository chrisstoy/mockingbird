'use server';

import { env } from '@/../env.mjs';

export async function apiUrlFor(path: string) {
  const API_HOST = env.VERCEL_URL ?? process.env.VERCEL_URL ?? env.API_HOST; // ex: 'localhost:3000';
  const API_PATH = env.API_PATH; // ex: '/api';

  console.log(`env.VERCEL_URL: ${env.VERCEL_URL}`);
  console.log(`process.env.VERCEL_URL: ${process.env.VERCEL_URL}`);
  console.log(`API_HOST: ${API_HOST}`);

  return `https://${API_HOST}${API_PATH}${path}`;
}
