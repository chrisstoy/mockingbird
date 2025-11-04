import { createClient } from './supabase/server';
import { ResponseError } from '../app/api/errors';
import type { User } from '@supabase/supabase-js';

/**
 * Validates that the user is authenticated via Supabase Auth
 * Throws ResponseError if not authenticated
 * Returns the authenticated Supabase user
 */
export async function validateAuthentication(): Promise<User> {
  const supabase = createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new ResponseError('Unauthorized', 401);
  }

  return user;
}

/**
 * Gets the current user session (nullable)
 * Returns the Supabase user or null if not authenticated
 */
export async function getSession(): Promise<User | null> {
  const supabase = createClient();

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
