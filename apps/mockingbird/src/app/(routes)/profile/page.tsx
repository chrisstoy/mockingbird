import Image from 'next/image';
import { auth } from '@/app/auth';
import { SignOutButton } from './_components/SignOutButton';
import { GENERIC_USER_IMAGE_URL } from '@/constants';

export default async function UserProfilePage() {
  const session = await auth();

  const userName = session?.user?.name ?? 'Unknown';
  const email = session?.user?.email;
  const imageSrc = session?.user?.image ?? GENERIC_USER_IMAGE_URL;

  return (
    <div className="hero  bg-base-100">
      <div className="hero-content flex-row">
        <Image
          src={imageSrc}
          alt="Profile Picture"
          className="w-40 max-w-sm rounded-lg shadow-2xl"
          width={128}
          height={128}
        />
        <div>
          <h1 className="text-5xl font-bold">{userName}</h1>
          <p className="py-6">{email}</p>
          <SignOutButton></SignOutButton>
        </div>
      </div>
    </div>
  );
}
