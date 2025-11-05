import { getSession } from '@/_server/auth';
import {
  EmailAddressSchema,
  SessionUser,
  SessionUserSchema,
  UserIdSchema,
} from '@/_types';

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

    const { data: id, error: userIdError } = UserIdSchema.safeParse(
      supabaseUser.id
    );

    const { data: email, error: emailError } = EmailAddressSchema.safeParse(
      supabaseUser.email
    );

    if (userIdError || emailError) {
      console.error(`sessionUser: ${userIdError} ${emailError}`);
      return undefined;
    }

    const user: SessionUser = {
      id,
      name: supabaseUser.user_metadata?.name || supabaseUser.email || 'Unknown',
      email,
      image: supabaseUser.user_metadata?.avatar_url || null,
    };

    return SessionUserSchema.parse(user);
  } catch (error) {
    console.error(`sessionUser: ${error}`);
    return undefined;
  }
}
