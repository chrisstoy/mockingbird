import { RouteParams } from '@/app/types';
import Link from 'next/link';

export default async function AuthErrorPage({ searchParams }: RouteParams) {
  const error = (await searchParams).error;

  return (
    <div className="flex flex-col justify-center">
      <h1 className="text-lg">There was an authentication error:</h1>
      <br />
      <div className="text-error">{error}</div>
      <br />
      <div>Please try signing in again</div>
      <br />
      <Link className="btn-link" href="/auth/signin">
        Sign In
      </Link>
    </div>
  );
}
