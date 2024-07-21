import { Session } from 'next-auth';
import { redirect } from 'next/navigation';

export function verifySignedIn(session: Session | null | undefined) {
  if (!session || !session?.user) {
    redirect('/api/auth/signin');
  }
}
