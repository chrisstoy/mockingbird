import NextAuth from 'next-auth';
import authConfig from './auth.config';
import { PrismaClient } from '@prisma/client';
import { PrismaAdapter } from '@auth/prisma-adapter';

const prisma = new PrismaClient();

export const BASE_PATH = '/api/auth';

const nextAuth = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  callbacks: {
    async session({ session, token, user }) {
      session.user.id = token?.sub || user?.id;
      return Promise.resolve(session);
    },
    // authorized: async ({ auth }) => {
    //   // Logged in users are authenticated, otherwise redirect to login page
    //   return !!auth;
    // },
  },
  ...authConfig,
});

export const { handlers, signIn, signOut, auth } = nextAuth;
