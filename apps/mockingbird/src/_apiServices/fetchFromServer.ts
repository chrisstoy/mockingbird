import { apiUrlFor } from './apiUrlFor';

/**
 * Fetch data from the server, using the API endpoint
 * @param endpoint - the API endpoint
 * @param options - the fetch options
 */
export async function fetchFromServer(endpoint: string, options?: RequestInit) {
  const apiUrl = await apiUrlFor(endpoint);
  // const headersList = headers();
  const requestInit = {
    ...options,
    // headers: {
    //   ...(options?.headers ?? {}),
    //   Cookie: headersList.get('Cookie') || '',
    // },
  };
  return await fetch(apiUrl, requestInit);
}
