'use client';
import Image from 'next/image';

interface Props {
  id: string;
  name: string;
  imageSrc: string;
  onSignIn: (serviceId: string) => void;
}

export function SignInButton({ id, name, imageSrc, onSignIn }: Props) {
  return (
    <button
      key={id}
      className="btn btn-outline w-full gap-3 font-medium"
      onClick={() => onSignIn(id)}
    >
      <Image src={imageSrc} alt={`${name} icon`} width={20} height={20} />
      Continue with {name}
    </button>
  );
}
