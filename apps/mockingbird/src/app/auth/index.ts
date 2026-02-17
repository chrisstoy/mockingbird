import NextAuth from 'next-auth';
import authConfig from './auth.config';
import { PrismaClient } from '../../../prisma/generated/client.js';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { PrismaPg } from '@prisma/adapter-pg';

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
    jwt({ token, account, user }) {
      if (account) {
        token.accessToken = account.access_token;
        token.id = user?.id;
      }
      // if (user) token.role = user.role;
      return token;
    },
    async session({ session, token, user }) {
      session.user.id = token?.sub || user?.id;
      // session.user.role = token.role;
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
      return !!auth;
    },
  },
  ...authConfig,
});

export const { handlers, signIn, signOut, auth } = nextAuth;
