import type { User } from '@supabase/supabase-js';
import { ResponseError } from '../app/api/errors';
import { createClient } from './supabase/server';

/**
 * Validates that the user is authenticated via Supabase Auth
 * Throws ResponseError if not authenticated
 * Returns the authenticated Supabase user
 */
export async function validateAuthentication(): Promise<User> {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new ResponseError(401, 'Unauthorized');
  }

  return user;
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

/**
 * Gets the current user session (nullable)
 * Returns the Supabase user or null if not authenticated
 */
export async function getSession(): Promise<User | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

/**
 * Gets the current user ID or throws if not authenticated
 */
export async function requireUserId(): Promise<string> {
  const user = await validateAuthentication();
  return user.id;
}
