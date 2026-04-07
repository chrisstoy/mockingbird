import { RouteParams } from '@/app/types';
import Link from 'next/link';

export default async function AuthErrorPage({ searchParams }: RouteParams) {
  const error = (await searchParams).error;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-base-content">
          Authentication Error
        </h1>
        <p className="text-sm text-base-content/60 mt-1">
          Something went wrong during sign in
        </p>
      </div>

      {error && (
        <div role="alert" className="alert alert-error">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 shrink-0 stroke-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-sm font-mono break-all">{error}</span>
        </div>
      )}

      <p className="text-sm text-base-content/60 leading-relaxed">
        Please try signing in again. If the problem persists, contact support.
      </p>

      <Link href="/auth/signin" className="btn btn-primary w-full">
        Back to Sign In
      </Link>
    </div>
  );
}
