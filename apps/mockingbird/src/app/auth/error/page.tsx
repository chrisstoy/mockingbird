import { RouteParams } from '@/app/types';
import Link from 'next/link';

export default function AuthErrorPage({ searchParams }: RouteParams) {
  return (
    <div className="flex flex-col justify-center">
      <h1>There was an authentication error</h1>
      <div>{searchParams.error}</div>
      <div>Please try signing in again</div>
      <Link href="/auth/signin">Sign In</Link>
    </div>
  );
}
