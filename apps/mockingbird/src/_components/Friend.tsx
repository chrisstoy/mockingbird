import Image from 'next/image';
import { getUser } from '@/_services/users';

type Props = {
  friendId: string;
};

export async function Friend({ friendId }: Props) {
  const friend = await getUser(friendId);

  const userName = friend?.name ?? 'Friend Not Found';
  const imageSrc = friend?.image ?? '/generic-user-icon.jpg';

  return (
    <div className="flex flex-row">
      <Image
        src={imageSrc}
        alt="Profile Picture"
        className="w-40 max-w-sm rounded-lg shadow-2xl"
        width={64}
        height={64}
      />
      <div>
        <h1 className="text-5xl font-bold">{userName}</h1>
      </div>
    </div>
  );
}
