import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import LocalCredentials from './localCredentials';

export const BASE_PATH = '/api/auth';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [GitHub, LocalCredentials],
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
});
