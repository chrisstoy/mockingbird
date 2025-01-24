'use server';
import { env } from '@/../env';

/**
 * Return the full URL needed to call the API function
 * @param endpoint - the API endpoint
 * @returns full URL
 */
export async function apiUrlFor(endpoint: string) {
  const baseUrl = await baseUrlForApi();
  return `${baseUrl}${endpoint}`;
}

export async function baseUrlForApi() {
  const API_HOST = env.VERCEL_URL ? `https://${env.VERCEL_URL}` : env.API_HOST; // ex: 'http://localhost:3000';
  const API_PATH = env.API_PATH; // ex: '/api';

  return `${API_HOST}${API_PATH}`;
}
