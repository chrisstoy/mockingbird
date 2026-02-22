import NextAuth from 'next-auth';
import authConfig from './auth.config';
import { PrismaClient } from '../../../prisma/generated/client.js';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { PrismaPg } from '@prisma/adapter-pg';
import { computePermissions } from '@/_types/permissions';
import { NextResponse } from 'next/server';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

export const BASE_PATH = '/api/auth';

const nextAuth = NextAuth({
  adapter: PrismaAdapter(prisma),
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    // see https://arc.net/l/quote/xmzhdhor
    async jwt({ token, account, user }) {
      if (account) {
        token.accessToken = account.access_token;
        token.id = user?.id;

        // Fetch role, status + permission overrides on sign-in
        if (user?.id) {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
              role: true,
              status: true,
              permissionOverrides: {
                select: { permission: true, granted: true },
              },
            },
          });
          if (dbUser) {
            token.permissions = computePermissions(
              dbUser.role,
              dbUser.permissionOverrides
            );
            token.status = dbUser.status;
          }
        }
      }
      return token;
    },
    async session({ session, token, user }) {
      session.user.id = token?.sub || user?.id;
      session.user.permissions = (token.permissions as string[]) ?? [];
      session.user.status = (token.status as string) ?? 'ACTIVE';
      return Promise.resolve(session);
    },
    authorized: async ({ auth, request }) => {
      if (
        request.nextUrl.pathname === '/auth/create-account' ||
        request.nextUrl.pathname.startsWith('/images') ||
        request.nextUrl.pathname.startsWith('/api')
      ) {
        return true;
      }

      if (!auth) return false;

      // Check if user is suspended and redirect to suspended page
      const userStatus = (auth.user as { status?: string }).status;
      if (userStatus === 'SUSPENDED') {
        if (request.nextUrl.pathname !== '/account/suspended') {
          return NextResponse.redirect(
            new URL('/account/suspended', request.nextUrl)
          );
        }
        return true;
      }

      // Guard admin routes
      if (request.nextUrl.pathname.startsWith('/admin')) {
        const permissions = (auth.user as { permissions?: string[] })
          .permissions;
        if (!permissions?.includes('admin:access')) {
          return NextResponse.redirect(new URL('/', request.nextUrl));
        }
      }

      return true;
    },
  },
  ...authConfig,
});

export const { handlers, signIn, signOut, auth } = nextAuth;
