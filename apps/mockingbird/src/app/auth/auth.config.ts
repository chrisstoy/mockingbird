import { NextAuthConfig } from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';
import LocalCredentials from './localCredentials';

// Notice this is only an object, not a full Auth.js instance
export default {
  providers: [GitHub, Google, LocalCredentials],
} satisfies NextAuthConfig;
