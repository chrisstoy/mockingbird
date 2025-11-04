import { ActiveSession } from '@/_types';
import { createClient } from '@/_server/supabase/server';
import { ResponseError } from './errors';

/**
 * Validates that there is an active Supabase Auth session
 *
 * @returns the active Session with user info
 * @throws {ResponseError} if not authenticated
 */
export async function validateAuthentication(): Promise<ActiveSession> {
  const supabase = createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new ResponseError(401, 'User not logged in');
  }

  // Convert Supabase user to ActiveSession format
  return {
    user: {
      id: user.id,
      name: user.user_metadata?.name || user.email || 'Unknown',
      email: user.email || null,
      image: user.user_metadata?.avatar_url || null,
    },
  };
}
