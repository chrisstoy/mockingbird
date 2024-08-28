'use client';
import { useState } from 'react';
import { SignInButton } from './_components/SignInButton';
import { signIn } from 'next-auth/react';

export default function SignInPage() {
  const providers = [
    {
      id: 'github',
      name: 'GitHub',
      iconSrc: 'https://authjs.dev/img/providers/github.svg',
    },
    // {
    //   id: 'google',
    //   name: 'Google',
    //   iconSrc: 'https://authjs.dev/img/providers/google.svg',
    // },
  ];

  const [selectedProvider, setSelectedProvider] = useState<string>('');

  async function handleSignin(serviceId: string) {
    setSelectedProvider(serviceId);
    signIn(serviceId, { callbackUrl: '/' });
  }

  return (
    <>
      {!selectedProvider && (
        <div className="flex flex-col">
          <h2 className="text-xl text-center mb-5">Sign in with...</h2>
          <div className="card-actions flex flex-col items-center">
            {providers.map(({ id, name, iconSrc }) => (
              <SignInButton
                key={id}
                id={id}
                name={name}
                imageSrc={iconSrc}
                onSignIn={handleSignin}
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
