'use client';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { redirect, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
// import { signInWithEmailAndPassword } from '../localCredentials';
import { SignInButton } from './_components/SignInButton';
import { AuthError } from 'next-auth';

async function signInWithEmailAndPassword(email: string, password: string) {
  try {
    await signIn('credentials', {
      email,
      password,
      callbackUrl: '/',
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return redirect(`/auth/error?error=${error.type}`);
    }
    throw error;
  }
}

export default function SignInPage() {
  const searchParams = useSearchParams();
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

  async function signInWithService(serviceId: string) {
    setSelectedProvider(serviceId);
    signIn(serviceId, { callbackUrl: '/' });
  }

  async function signInWithUserAndPassword(formData: FormData) {
    const email = formData.get('email')?.toString();
    const password = formData.get('password')?.toString();

    if (!email || !password) {
      return;
    }

    // TODO: validate inputs
    setSelectedProvider('credentials');
    await signInWithEmailAndPassword(email, password);
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
            <>
              <form action={signInWithUserAndPassword}>
                <div className="card-actions flex flex-col items-center">
                  <input
                    id="email"
                    name="email"
                    type="text"
                    placeholder="user@example.com"
                    className="input input-bordered w-full max-w-xs"
                  />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Password"
                    className="input input-bordered w-full max-w-xs"
                  />
                  <button type="submit" className="btn btn-primary w-full">
                    Sign In
                  </button>
                </div>
              </form>
              <div className="flex flex-col items-center space-y-4">
                <Link className="link link-hover" href="/auth/forgot-password">
                  Forgot Password
                </Link>
                <Link
                  className="btn btn-sm btn-secondary w-full"
                  href="/auth/create-account"
                >
                  Create new account
                </Link>
              </div>
              <div className="divider"></div>
              <h2 className="text-xl text-center mb-5">or sign in with...</h2>
            </>
          )}
          <div className="card-actions flex flex-col items-center">
            {providers.map(({ id, name, iconSrc }) => (
              <SignInButton
                key={id}
                id={id}
                name={name}
                imageSrc={iconSrc}
                onSignIn={signInWithService}
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
