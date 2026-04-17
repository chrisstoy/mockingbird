import { auth } from '@/app/auth';
import { ResendVerificationButton } from './_components/ResendVerificationButton.client';
import { SignInLink } from './_components/SignInLink.client';

export default async function VerifyEmailPage() {
  const session = await auth();
  const email = session?.user?.email;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-base-content">
          Verify your email
        </h1>
        <p className="text-sm text-base-content/60 mt-1">
          One more step to get started
        </p>
      </div>

      <div className="flex flex-col gap-3 text-sm text-base-content/70 leading-relaxed">
        <p>
          We sent a verification link to{' '}
          <span className="font-semibold text-base-content">{email}</span>.
          Click the link in the email to activate your account.
        </p>
        <p className="text-base-content/50">
          Didn&apos;t receive it? Check your spam folder or resend below.
        </p>
      </div>

      <ResendVerificationButton />

      <p className="text-sm text-center text-base-content/50">
        Not you? <SignInLink></SignInLink>
      </p>
    </div>
  );
}
