'use client';
import { ResponseError } from '@/app/api/errors';
import { baseUrlForApi } from './apiUrlFor';

let baseApiUrl: Promise<string>;

export async function getBaseApiUrl() {
  if (!baseApiUrl) {
    baseApiUrl = new Promise<string>((resolve) => {
      // baseUrlForApi().then((url) => {
      //   resolve(url);
      // });
      resolve('/api'); // use the base URL for the website as root of API
    });
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
  const requestInit: RequestInit = {
    ...options,
    credentials: 'include',
  };
  const response = await fetch(apiUrl, requestInit);
  if (!response.ok) {
    throw new ResponseError(response.status, response.statusText);
  }
  return response;
}
