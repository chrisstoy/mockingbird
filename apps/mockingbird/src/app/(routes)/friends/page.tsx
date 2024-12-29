import { sessionUser } from '@/_hooks/sessionUser';
import { redirect } from 'next/navigation';
import { FriendsContainer } from './_components/FriendsContainer.client';

export default async function FriendsPage() {
  const user = await sessionUser();
  if (!user) {
    redirect('/auth/signin');
  }

  return <FriendsContainer></FriendsContainer>;
}
