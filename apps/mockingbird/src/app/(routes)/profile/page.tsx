import { sessionUser } from '@/_hooks/sessionUser';
import { GENERIC_USER_IMAGE_URL } from '@/constants';
import { DeleteAccountButton } from './_components/DeleteAccountButton.client';
import { ProfilePictureButton } from './_components/ProfilePictureButton.client';
import { SignOutButton } from './_components/SignOutButton.client';

export default async function UserProfilePage() {
  const user = await sessionUser();

  const userName = user?.name ?? 'Unknown';
  const email = user?.email;
  const imageSrc = user?.image ?? GENERIC_USER_IMAGE_URL;

  return (
    <div className="hero bg-base-100">
      <div className="hero-content flex-row">
        <ProfilePictureButton currentImageSrc={imageSrc} />
        <div>
          <h1 className="text-5xl font-bold">{userName}</h1>
          <p className="py-6">{email}</p>
          <div className="flex flex-row justify-between items-center">
            <SignOutButton></SignOutButton>
            <DeleteAccountButton></DeleteAccountButton>
          </div>
        </div>
      </div>
    </div>
  );
}
