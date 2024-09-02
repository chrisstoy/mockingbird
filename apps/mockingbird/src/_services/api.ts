'use server';

const API_HOST = 'http://localhost:3000';
const API_PATH = '/api';

export async function apiUrlFor(path: string) {
  return `${API_HOST}${API_PATH}${path}`;
}
