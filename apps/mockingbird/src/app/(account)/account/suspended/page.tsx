import { auth } from '@/app/auth';
import { redirect } from 'next/navigation';
import { SignOutButton } from './_components/SignOutButton.client';
import { prisma } from '@/_server/db';

export default async function SuspendedAccountPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  // Fetch user to get suspension reason, name, and email
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      suspensionReason: true,
    },
  });

  // If not suspended, redirect to home
  if (user?.status !== 'SUSPENDED') {
    redirect('/');
  }

  // Prepare email body with user information
  const emailBody = `Account Information:
Name: ${user.name}
Email: ${user.email}
User ID: ${user.id}

---
Please describe why you believe your account suspension should be reviewed:

`;

  const mailtoUrl = `mailto:support@mockingbird.app?subject=${encodeURIComponent('Account Suspension Appeal')}&body=${encodeURIComponent(emailBody)}`;

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Main Card */}
        <div className="bg-base-100 rounded-box border border-base-300 shadow-xl overflow-hidden">
          {/* Status Bar */}
          <div
            className="h-2"
            style={{
              background:
                'linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)',
            }}
          />

          {/* Content */}
          <div className="p-8 md:p-12">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '2px solid rgba(239, 68, 68, 0.15)',
                }}
              >
                <svg
                  className="w-10 h-10 text-error"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-8">
              <h1
                className="text-3xl md:text-4xl font-bold tracking-tight mb-3"
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              >
                Account Suspended
              </h1>
              <p className="text-base-content/60 text-sm md:text-base max-w-md mx-auto leading-relaxed">
                Your Mockingbird account has been temporarily suspended and you
                are unable to access the platform.
              </p>
            </div>

            {/* Reason Section */}
            {user.suspensionReason && (
              <div className="mb-8">
                <div className="bg-base-200 rounded-lg border border-base-300 p-6">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <svg
                        className="w-5 h-5 text-base-content/40"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xs font-semibold tracking-widest uppercase text-base-content/40 mb-2">
                        Reason
                      </h3>
                      <p className="text-sm leading-relaxed text-base-content/80">
                        {user.suspensionReason}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-base-300 my-8" />

            {/* Appeal Section */}
            <div className="mb-8">
              <h3 className="text-xs font-semibold tracking-widest uppercase text-base-content/40 mb-4">
                What You Can Do
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-base-content/30">•</div>
                  <p className="text-sm text-base-content/70 leading-relaxed">
                    If you believe this suspension was made in error, you may{' '}
                    <a
                      href={mailtoUrl}
                      className="text-primary hover:underline font-medium"
                    >
                      contact our support team
                    </a>{' '}
                    to appeal this decision.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-base-content/30">•</div>
                  <p className="text-sm text-base-content/70 leading-relaxed">
                    Review our{' '}
                    <a
                      href="/legal/terms"
                      className="text-primary hover:underline font-medium"
                    >
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a
                      href="/legal/privacy"
                      className="text-primary hover:underline font-medium"
                    >
                      Community Guidelines
                    </a>{' '}
                    to understand our policies.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
              <a
                href={mailtoUrl}
                className="btn btn-primary btn-sm w-full sm:w-auto"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Contact Support
              </a>
              <SignOutButton />
            </div>
          </div>

          {/* Footer */}
          <div className="bg-base-200 px-8 py-4 border-t border-base-300">
            <p className="text-xs text-center text-base-content/40">
              For urgent matters, email us at{' '}
              <a
                href="mailto:support@mockingbird.app"
                className="text-base-content/60 hover:text-base-content/80 font-medium"
              >
                support@mockingbird.app
              </a>
            </p>
          </div>
        </div>

        {/* Branding */}
        <div className="mt-8 text-center">
          <p className="text-xs text-base-content/30 tracking-wider">
            MOCKINGBIRD
          </p>
        </div>
      </div>
    </div>
  );
}
