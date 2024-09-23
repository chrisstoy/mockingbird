import { auth } from '@/app/auth';
import { FriendsContainer } from './_components/FriendsContainer.client';

export default async function FriendsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    // TODO - we should never get here!
    return (
      <div>
        <h1>Friends</h1>
        <p>You must be signed in to view your friends</p>
      </div>
    );
  }

  return <FriendsContainer></FriendsContainer>;
}
