import {
  EmailAddressSchema,
  SessionUser,
  SessionUserSchema,
  UserIdSchema,
} from '@/_types';
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
        const { data: id, error: userIdError } = UserIdSchema.safeParse(
          supabaseUser.id
        );

        const { data: email, error: emailError } = EmailAddressSchema.safeParse(
          supabaseUser.email
        );

        if (userIdError || emailError) {
          console.error(`useSessionUser: ${userIdError} ${emailError}`);
          setUser(undefined);
          return;
        }

        try {
          const sessionUser: SessionUser = {
            id,
            name:
              supabaseUser.user_metadata?.name ||
              supabaseUser.email ||
              'Unknown',
            email,
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
        const { data: id, error: userIdError } = UserIdSchema.safeParse(
          session.user.id
        );

        const { data: email, error: emailError } = EmailAddressSchema.safeParse(
          session.user.email
        );

        if (userIdError || emailError) {
          console.error(`onAuthStateChange: ${userIdError} ${emailError}`);
          setUser(undefined);
          return;
        }

        try {
          const sessionUser: SessionUser = {
            id,
            name:
              session.user.user_metadata?.name ||
              session.user.email ||
              'Unknown',
            email,
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
