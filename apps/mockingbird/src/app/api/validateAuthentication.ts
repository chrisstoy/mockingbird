import { createClient } from '@/_server/supabase/server';
import { ActiveSession, EmailAddressSchema, UserIdSchema } from '@/_types';
import { ResponseError } from './errors';

/**
 * Validates that there is an active Supabase Auth session
 *
 * @returns the active Session with user info
 * @throws {ResponseError} if not authenticated
 */
export async function validateAuthentication(): Promise<ActiveSession> {
  const supabase = await createClient();

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new ResponseError(401, 'User not logged in');
  }

  const user = session.user;

  const { data: id, error: userIdError } = UserIdSchema.safeParse(user.id);
  const { data: email, error: emailError } = EmailAddressSchema.safeParse(
    user.email
  );

  if (userIdError || emailError) {
    console.error(`useSessionUser: ${userIdError} ${emailError}`);
    throw new ResponseError(401, 'No user Id or email found for user');
  }

  const expires =
    typeof session.expires_at === 'number'
      ? new Date(session.expires_at * 1000).toISOString()
      : session.expires_at || new Date().toISOString();

  // Convert Supabase session to ActiveSession format
  return {
    expires,
    user: {
      id: id,
      name: user.user_metadata?.name || user.email || 'Unknown',
      email: email,
      image: user.user_metadata?.avatar_url || null,
    },
  };
}
