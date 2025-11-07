import { createClient } from '@/_server/supabase/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Check if user record exists in database
      try {
        const checkResponse = await fetch(
          `${origin}/api/users/${data.user.id}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        // If user doesn't exist, create them
        if (checkResponse.status === 404) {
          const name =
            data.user.user_metadata?.name ||
            data.user.user_metadata?.full_name ||
            data.user.email?.split('@')[0] ||
            'User';

          await fetch(`${origin}/api/users`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: data.user.id,
              name,
              email: data.user.email,
            }),
          });
        }
      } catch (err) {
        console.error('Error creating user profile:', err);
        // Continue anyway - user is authenticated
      }

      // Redirect to feed after successful authentication
      return NextResponse.redirect(`${origin}/`);
    }
  }

  // If there's an error, redirect to signin with error
  return NextResponse.redirect(`${origin}/auth/signin?error=auth_failed`);
}
