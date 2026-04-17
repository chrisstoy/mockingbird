import Link from 'next/link';

interface Props {
  searchParams: Promise<{ email?: string }>;
}

export default async function WelcomePage({ searchParams }: Props) {
  const { email } = await searchParams;

  const signInHref = email
    ? `/auth/signin?email=${encodeURIComponent(email)}`
    : '/auth/signin';

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-base-content">
          Welcome to Mockingbird
        </h1>
        <p className="text-sm text-base-content/60 mt-1">
          Your email is verified. You&apos;re all set.
        </p>
      </div>

      <p className="text-sm text-base-content/70 leading-relaxed">
        Sign in below to get started.
      </p>

      <Link href={signInHref} className="btn btn-primary w-full">
        Sign In
      </Link>
    </div>
  );
}
