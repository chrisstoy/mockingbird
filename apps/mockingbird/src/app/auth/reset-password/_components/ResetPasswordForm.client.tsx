'use client';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Props {
  token: string;
}

export function ResetPasswordForm({ token }: Props) {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsProcessing(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(
          data.error ??
            'This link is invalid or expired. Please request a new password reset.'
        );
        return;
      }

      const email = data.email as string;
      await signIn('credentials', {
        email,
        password: newPassword,
        redirectTo: '/',
        redirect: false,
      });
      router.replace('/');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }

  if (!token) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-base-content">
            Reset Password
          </h1>
          <p className="text-sm text-base-content/60 mt-1">Invalid link</p>
        </div>
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
          <span className="text-sm">
            This link is invalid or expired. Please request a new password
            reset.
          </span>
        </div>
        <Link className="btn btn-primary w-full" href="/auth/forgot-password">
          Request new reset link
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-base-content">
          Reset Password
        </h1>
        <p className="text-sm text-base-content/60 mt-1">
          Enter your new password below.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" autoComplete="off">
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
            <span className="text-sm">
              {error}
              {error.includes('invalid or expired') && (
                <>
                  {' '}
                  <Link className="underline font-medium" href="/auth/forgot-password">
                    Request a new one.
                  </Link>
                </>
              )}
            </span>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <div className="form-control w-full">
            <input
              type="password"
              className="input input-bordered w-full"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={isProcessing}
              minLength={8}
              maxLength={20}
            />
          </div>
          <div className="form-control w-full">
            <input
              type="password"
              className="input input-bordered w-full"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isProcessing}
              minLength={8}
              maxLength={20}
            />
          </div>
        </div>

        {isProcessing ? (
          <div className="flex items-center justify-center gap-3 py-2">
            <span className="loading loading-spinner loading-sm text-primary" />
            <span className="text-sm text-base-content/60">
              Updating password...
            </span>
          </div>
        ) : (
          <button type="submit" className="btn btn-primary w-full">
            Reset Password
          </button>
        )}
      </form>

      <p className="text-center text-sm text-base-content/60">
        <Link
          className="text-primary font-semibold hover:underline"
          href="/auth/forgot-password"
        >
          Request a different reset link
        </Link>
      </p>
    </div>
  );
}
