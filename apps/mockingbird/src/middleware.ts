import { type NextRequest, NextResponse } from 'next/server';

// the list of all allowed origins
const allowedOrigins = [
  'http://localhost:3000',
  'https://mockingbird.chrisstoy.com',
  /https?:\/\/.*\.vercel\.com/,
];

export default function middleware(req: NextRequest) {
  // Response
  const response = NextResponse.next();

  // Allowed origins check
  const origin = req.headers.get('origin') ?? '';
  const isOriginAllowed = allowedOrigins.find((o) => {
    if (typeof o === 'string') {
      const r = origin.includes(o);
      return r;
    } else {
      const r = origin.search(o);
      return r !== -1;
    }
  });

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
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
  runtime: 'nodejs',
};
