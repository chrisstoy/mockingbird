import { AuthUser, AuthUserSchema } from '@/_types/users';
import { useSession } from 'next-auth/react';
import { useMemo } from 'react';

/**
 * hook to get the AuthUser from the current auth session
 * @returns AuthUser or undefined if no Session or User
 */

export function useSessionUser() {
  const { data: session } = useSession();
  const user = useMemo(() => {
    try {
      const user: AuthUser | undefined = AuthUserSchema.optional().parse(
        session?.user
      );
      return user;
    } catch (error) {
      return undefined;
    }
  }, [session?.user]);
  return user;
}
