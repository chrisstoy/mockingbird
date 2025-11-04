import { SessionUser, SessionUserSchema } from '@/_types';
import { getSession } from '@/_server/auth';

/**
 * Get the SessionUser from the current Supabase auth session (server-side)
 * @returns SessionUser or undefined if no Session or User
 */
export async function sessionUser() {
  try {
    const supabaseUser = await getSession();
    if (!supabaseUser) {
      return undefined;
    }

    const user: SessionUser = {
      id: supabaseUser.id,
      name: supabaseUser.user_metadata?.name || supabaseUser.email || 'Unknown',
      email: supabaseUser.email || null,
      image: supabaseUser.user_metadata?.avatar_url || null,
    };

    return SessionUserSchema.parse(user);
  } catch (error) {
    console.error(`sessionUser: ${error}`);
    return undefined;
  }
}
