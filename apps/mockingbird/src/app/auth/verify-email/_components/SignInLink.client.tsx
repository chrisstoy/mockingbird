'use client';
import { signOut } from 'next-auth/react';

function handleSignout() {
  signOut({ callbackUrl: '/auth/signin' });
}

export function SignInLink() {
  return (
    <button
      onClick={() => handleSignout()}
      className="text-primary hover:underline font-medium"
    >
      Sign in
    </button>
  );
}
