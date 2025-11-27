import { createClient } from '@/_server/supabase/server';
import { DocumentIdSchema } from '@/_types';
import { getLoginRedirectUrlForUser } from '@/_utils/getLoginRedirectForUser';
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
      // User record is automatically created by PostgreSQL trigger
      // when the Supabase Auth user is created (on_auth_user_created)
      // For OAuth flows, the user_metadata is automatically populated by Supabase

      // Redirect to original page, or get login redirect URL
      const { data: acceptedToS } = DocumentIdSchema.safeParse(
        data.user.user_metadata?.acceptedToS
      );

      const loginRedirect = await getLoginRedirectUrlForUser({
        acceptedToS,
      });
      const redirectUrl = new URL(loginRedirect, origin);

      // Redirect to feed after successful authentication
      return NextResponse.redirect(redirectUrl);
    }
  }

  // If there's an error, redirect to signin with error
  return NextResponse.redirect(`${origin}/auth/signin?error=auth_failed`);
}
