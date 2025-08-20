import { SessionUser, SessionUserSchema } from '@/_types';
import { auth } from '@/app/auth';

/**
 * Get the AuthUser from the current auth session
 * @returns AuthUser or undefined if no Session or User
 */
export async function sessionUser() {
  const session = await auth();
  try {
    const user: SessionUser | undefined = SessionUserSchema.optional().parse(
      session?.user
    );
    return user;
  } catch (error) {
    console.error(`sessionUser: ${error}`);
    return undefined;
  }
}
