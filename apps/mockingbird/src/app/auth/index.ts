import { computePermissions } from '@/_types/permissions';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { PrismaPg } from '@prisma/adapter-pg';
import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { PrismaClient } from '../../../prisma/generated/client.js';
import authConfig from './auth.config';

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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
    async jwt({ token, account, user, trigger, session: sessionUpdate }) {
      if (account || trigger === 'update') {
        // Ensure token.sub is set on initial sign-in (NextAuth v5 beta may not set it automatically for credentials)
        if (user?.id) {
          token.sub = user.id;
        }
        token.accessToken = account?.access_token;
        token.id = user?.id ?? token.sub;

        const userId = user?.id ?? (token.sub as string | undefined);
        // Fetch role, status, permission overrides + TOS status on sign-in or session update
        if (userId) {
          const dbUser = await prisma.user.findUnique({
            where: { id: userId },
            select: {
              role: true,
              status: true,
              acceptedToS: true,
              image: true,
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
            token.picture = dbUser.image;

            const latestTos = await prisma.document.findFirst({
              where: { type: 'TOC' },
              orderBy: { createdAt: 'desc' },
              select: { id: true },
            });
            token.requiresTOS =
              !dbUser.acceptedToS ||
              (!!latestTos && latestTos.id !== dbUser.acceptedToS);
          }
        }
      } else if (token.requiresTOS === true) {
        // Re-check TOS from DB on each request while requiresTOS is true.
        // This self-corrects after the user accepts TOS without relying on
        // update() persisting a new cookie (which is unreliable in NextAuth v5 beta).
        const userId =
          (token.id as string | undefined) || (token.sub as string | undefined);
        if (userId) {
          const dbUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { acceptedToS: true },
          });
          if (dbUser) {
            const latestTos = await prisma.document.findFirst({
              where: { type: 'TOC' },
              orderBy: { createdAt: 'desc' },
              select: { id: true },
            });
            token.requiresTOS =
              !dbUser.acceptedToS ||
              (!!latestTos && latestTos.id !== dbUser.acceptedToS);
          }
        }
      }

      // Handle session update trigger (e.g. profile picture change)
      if (trigger === 'update' && sessionUpdate?.image) {
        token.picture = sessionUpdate.image;
      }

      return token;
    },
    async session({ session, token, user }) {
      session.user.id = (token?.id as string) || token?.sub || user?.id;
      session.user.permissions = (token.permissions as string[]) ?? [];
      session.user.status = (token.status as string) ?? 'ACTIVE';
      if (token.picture) {
        session.user.image = token.picture as string;
      }
      session.user.requiresTOS = (token.requiresTOS as boolean) ?? false;
      return Promise.resolve(session);
    },
    authorized: async ({ auth, request }) => {
      if (
        request.nextUrl.pathname === '/auth/create-account' ||
        request.nextUrl.pathname === '/auth/forgot-password' ||
        request.nextUrl.pathname === '/auth/reset-password' ||
        request.nextUrl.pathname === '/auth/expired-password' ||
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

      // Check if user needs to accept TOS
      const requiresTOS = (auth.user as { requiresTOS?: boolean }).requiresTOS;
      if (requiresTOS && request.nextUrl.pathname !== '/auth/tos') {
        const tosUrl = new URL('/auth/tos', request.nextUrl);
        tosUrl.searchParams.set('requireAcceptance', 'true');
        const userId = auth.user?.id;
        if (userId) tosUrl.searchParams.set('userId', userId);
        return NextResponse.redirect(tosUrl);
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
