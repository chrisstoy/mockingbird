import { env } from '@/../env';
import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

// the list of all allowed origins
const allowedOrigins = [
  'http://localhost:3000',
  `https://${env.VERCEL_URL}`,
  `https:.//${env.VERCEL_PROJECT_PRODUCTION_URL}`,
];

// Public routes that don't require authentication
const publicRoutes = ['/', '/auth/signin', '/auth/signup', '/auth/callback', '/privacy', '/privacy/tos'];

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Refresh session if expired - this will update the session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.includes(req.nextUrl.pathname);

  // If user is not authenticated and trying to access a protected route
  if (!user && !isPublicRoute) {
    // Redirect to signin with the original URL as a callback
    const redirectUrl = new URL('/auth/signin', req.url);
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If user is authenticated and trying to access signin/signup, redirect to home
  if (user && (req.nextUrl.pathname === '/auth/signin' || req.nextUrl.pathname === '/auth/signup')) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Allowed origins check
  const origin = req.headers.get('origin') ?? '';
  const isOriginAllowed = allowedOrigins.find((o) => o && origin.includes(o));

  if (isOriginAllowed) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }

  // Set default CORS headers
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET,OPTIONS,PATCH,DELETE,POST,PUT'
  );
  response.headers.set(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Return
  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|images|favicon.ico).*)',
  ],
  runtime: 'nodejs',
};
