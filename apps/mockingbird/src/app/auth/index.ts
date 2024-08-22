import NextAuth from 'next-auth';
import authConfig from './auth.config';
import { PrismaClient } from '@prisma/client';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

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
    jwt({ token, user }) {
      // if (user) token.role = user.role;
      return token;
    },
    async session({ session, token, user }) {
      session.user.id = token?.sub || user?.id;
      // session.user.role = token.role;
      return Promise.resolve(session);
    },
    authorized: async ({ auth, request }) => {
      // TODO - protect API routes
      // if (request.method === 'POST') {
      //   const { authToken } = (await request.json()) ?? {};
      //   // If the request has a valid auth token, it is authorized
      //   const valid = await validateAuthToken(authToken);
      //   if (valid) return true;
      //   return NextResponse.json('Invalid auth token', { status: 401 });
      // }

      // Logged in users are authenticated, otherwise redirect to login page
      return !!auth;
    },
  },
  ...authConfig,
});

export const { handlers, signIn, signOut, auth } = nextAuth;
