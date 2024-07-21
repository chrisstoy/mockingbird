import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import LocalCredentials from './localCredentials';

export const BASE_PATH = '/api/auth';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [GitHub, LocalCredentials],
  // callbacks: {
  //   authorized: async ({ auth }) => {
  //     // Logged in users are authenticated, otherwise redirect to login page
  //     return !!auth;
  //   },
  // },
});
