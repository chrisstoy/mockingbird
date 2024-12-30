import { SessionUser, SessionUserSchema } from '@/_types/users';
import { useSession } from 'next-auth/react';
import { useMemo } from 'react';

/**
 * hook to get the SessionUser from the current auth session
 * @returns SessionUser or undefined if no Session or User
 */
export function useSessionUser() {
  const { data: session } = useSession();
  const user = useMemo(() => {
    try {
      const user: SessionUser | undefined = SessionUserSchema.optional().parse(
        session?.user
      );
      return user;
    } catch (error) {
      return undefined;
    }
  }, [session?.user]);
  return user;
}
