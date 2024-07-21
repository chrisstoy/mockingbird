'use server';

import { signIn } from '.';

export async function handleSignIn() {
  await signIn(undefined, { callbackUrl: '/' });
}
