'use client';
import { AuthError } from 'next-auth';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { redirect, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SignInButton } from './_components/SignInButton.client';
import { SignInEmailPassword } from './_components/SignInEmailPassword.client';

export default function SignInPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(searchParams.get('error'));
  }, [searchParams]);

  const includeCredentialProvider = true;

  const providers = [
    {
      id: 'github',
      name: 'GitHub',
      iconSrc: 'https://authjs.dev/img/providers/github.svg',
    },
    {
      id: 'google',
      name: 'Google',
      iconSrc: 'https://authjs.dev/img/providers/google.svg',
    },
  ];

  const [selectedProvider, setSelectedProvider] = useState<string>('');

  async function handleSignInWithEmailAndPassword(
    email: string,
    password: string
  ) {
    try {
      setSelectedProvider('credentials');
      await signIn('credentials', {
        email,
        password,
        callbackUrl,
      });
    } catch (error) {
      if (error instanceof AuthError) {
        return redirect(`/auth/error?error=${error.type}`);
      }
      throw error;
    }
  }

  async function handleSignInWithService(serviceId: string) {
    setSelectedProvider(serviceId);
    signIn(serviceId, { callbackUrl });
  }

  return (
    <>
      {!selectedProvider && (
        <div className="flex flex-col">
          <h1 className="text-2xl text-center mb-2">Sign In</h1>
          {error && (
            <div className="text-error p-1">Sign In Error: {error}</div>
          )}

          {includeCredentialProvider && (
            <div className="text-center">
              <SignInEmailPassword
                onSignIn={handleSignInWithEmailAndPassword}
              ></SignInEmailPassword>
              <div className="flex flex-col items-center space-y-4">
                <Link className="link link-hover" href="/auth/forgot-password">
                  Forgot Password
                </Link>
                <Link
                  className="btn btn-sm btn-secondary w-full max-w-xs"
                  href="/auth/create-account"
                >
                  Create new account
                </Link>
              </div>
              <div className="divider"></div>
              <h2 className="text-xl text-center mb-5">or sign in with...</h2>
            </div>
          )}
          <div className="card-actions flex flex-col items-center">
            {providers.map(({ id, name, iconSrc }) => (
              <SignInButton
                key={id}
                id={id}
                name={name}
                imageSrc={iconSrc}
                onSignIn={handleSignInWithService}
              />
            ))}
          </div>
        </div>
      )}
      {selectedProvider && (
        <div className="flex flex-col items-center">
          <div className="text-xl mb-5">Joining the plagiary...</div>
          <span className="loading loading-ring loading-lg"></span>
        </div>
      )}
    </>
  );
}
