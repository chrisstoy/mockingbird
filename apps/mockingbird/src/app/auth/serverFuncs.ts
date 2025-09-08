'use server';
import { signOut as authSignOut } from '@/app/auth';

/**
 * Signs out the current user from the authentication system.
 *
 * @note This function is intended to be used on the client side.
 *
 * @param redirectTo - Optional URL to redirect the user to after signing out.
 * @returns A promise that resolves when the sign-out process is complete.
 */
export async function signOut(redirectTo?: string | undefined) {
  return authSignOut({ redirectTo });
}
