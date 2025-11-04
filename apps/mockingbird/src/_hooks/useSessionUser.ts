import { SessionUser, SessionUserSchema } from '@/_types';
import { createClient } from '@/_utils/supabase/client';
import { useEffect, useState } from 'react';

/**
 * hook to get the SessionUser from the current Supabase auth session
 * @returns SessionUser or undefined if no Session or User
 */
export function useSessionUser() {
  const [user, setUser] = useState<SessionUser | undefined>(undefined);
  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(({ data: { user: supabaseUser } }) => {
      if (supabaseUser) {
        try {
          const sessionUser: SessionUser = {
            id: supabaseUser.id,
            name: supabaseUser.user_metadata?.name || supabaseUser.email || 'Unknown',
            email: supabaseUser.email || null,
            image: supabaseUser.user_metadata?.avatar_url || null,
          };
          setUser(SessionUserSchema.parse(sessionUser));
        } catch {
          setUser(undefined);
        }
      } else {
        setUser(undefined);
      }
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        try {
          const sessionUser: SessionUser = {
            id: session.user.id,
            name: session.user.user_metadata?.name || session.user.email || 'Unknown',
            email: session.user.email || null,
            image: session.user.user_metadata?.avatar_url || null,
          };
          setUser(SessionUserSchema.parse(sessionUser));
        } catch {
          setUser(undefined);
        }
      } else {
        setUser(undefined);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return user;
}
