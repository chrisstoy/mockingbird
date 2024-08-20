import NextAuth from 'next-auth';
import authConfig from './auth.config';
import { PrismaClient } from '@prisma/client';
import { PrismaAdapter } from '@auth/prisma-adapter';

const prisma = new PrismaClient();

export const BASE_PATH = '/api/auth';

const nextAuth = NextAuth({
  adapter: PrismaAdapter(prisma),
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async session({ session, token, user }) {
      session.user.id = token?.sub || user?.id;
      return Promise.resolve(session);
    },
  },
  ...authConfig,
});

export const { handlers, signIn, signOut, auth } = nextAuth;
