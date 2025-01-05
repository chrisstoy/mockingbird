'use server';
import { env } from '@/../env.mjs';

/**
 * Return the full URL needed to call the API function
 * @param endpoint - the API endpoint
 * @returns full URL
 */
export async function apiUrlFor(endpoint: string) {
  const API_HOST = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : env.API_HOST; // ex: 'http://localhost:3000';
  const API_PATH = env.API_PATH; // ex: '/api';

  return `${API_HOST}${API_PATH}${endpoint}`;
}
