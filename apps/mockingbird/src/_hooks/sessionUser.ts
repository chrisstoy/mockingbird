import { AuthUser, AuthUserSchema } from '@/_types/users';
import { auth } from '@/app/auth';

/**
 * Get the AuthUser from the current auth session
 * @returns AuthUser or undefined if no Session or User
 */
export async function sessionUser() {
  const session = await auth();
  try {
    const user: AuthUser | undefined = AuthUserSchema.optional().parse(
      session?.user
    );
    return user;
  } catch (error) {
    return undefined;
  }
}
