'use client';
import { baseUrlForApi } from './apiUrlFor';

let baseApiUrl: string;

export async function getBaseApiUrl() {
  if (!baseApiUrl) {
    baseApiUrl = await baseUrlForApi();
  }
  return baseApiUrl;
}

/**
 * Fetch data from the server, using the API endpoint
 * @param endpoint - the API endpoint
 * @param options - the fetch options
 */
export async function fetchFromServer(endpoint: string, options?: RequestInit) {
  const baseApiUrl = await getBaseApiUrl();
  const apiUrl = `${baseApiUrl}${endpoint}`;
  const requestInit = {
    ...options,
  };
  return await fetch(apiUrl, requestInit);
}
