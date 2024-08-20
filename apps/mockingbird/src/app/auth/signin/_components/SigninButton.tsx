'use client';
import { signIn } from 'next-auth/react';
import Image from 'next/image';

interface Props {
  id: string;
  name: string;
  imageSrc: string;
}

export function SigninButton({ id, name, imageSrc }: Props) {
  function handleSignin() {
    signIn(id, { callbackUrl: '/' });
  }

  return (
    <button key={id} className="btn btn-primary w-[75%]" onClick={handleSignin}>
      <Image src={imageSrc} alt={`${name} Icon`} width="32" height="32" />
      {name}
    </button>
  );
}
