import { auth } from '@/app/auth';
import { ResendVerificationButton } from './_components/ResendVerificationButton.client';

export default async function VerifyEmailPage() {
  const session = await auth();
  const email = session?.user?.email;

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body items-center text-center gap-4">
          <h1 className="card-title text-2xl">Verify your email</h1>
          <p className="text-base-content/70">
            We sent a verification link to{' '}
            <span className="font-semibold text-base-content">{email}</span>.
            Click the link in the email to activate your account.
          </p>
          <p className="text-sm text-base-content/50">
            Didn&apos;t receive it? Check your spam folder or resend below.
          </p>
          <ResendVerificationButton />
        </div>
      </div>
    </div>
  );
}
