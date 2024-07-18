import Image from 'next/image';
import { UserButton } from './UserButton';
import Link from 'next/link';

export function Header() {
  return (
    <div className="navbar bg-neutral text-neutral-content">
      <Link href="/">
        <Image
          className={'ml-2 w-auto h-auto'}
          src="/mockingbird-white.png"
          alt="Mockingbird"
          width={64}
          height={64}
        />
        Mockingbird
      </Link>
      <div className="flex-grow"></div>
      <UserButton></UserButton>
    </div>
  );
}
