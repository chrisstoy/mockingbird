'use client';
import Image from 'next/image';

interface Props {
  id: string;
  name: string;
  imageSrc: string;
  onSignIn: (serviceId: string) => void;
}

export function SigninButton({ id, name, imageSrc, onSignIn }: Props) {
  async function handleSignin() {
    onSignIn(id);
  }

  return (
    <button key={id} className="btn btn-primary w-[75%]" onClick={handleSignin}>
      <Image src={imageSrc} alt={`${name} Icon`} width="32" height="32" />
      <span className="text-primary-content">{name}</span>
    </button>
  );
}
