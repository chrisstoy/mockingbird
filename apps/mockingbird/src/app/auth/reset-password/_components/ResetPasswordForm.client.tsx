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
      <div className="flex flex-col items-center text-center gap-4">
        <h1 className="text-2xl mb-2">Reset Password</h1>
        <div className="text-error p-1">
          This link is invalid or expired. Please request a new password reset.
        </div>
        <Link className="link link-hover" href="/auth/forgot-password">
          Request new reset link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col" autoComplete="off">
      <h1 className="text-2xl text-center mb-2">Reset Password</h1>
      <p className="text-sm text-base-content/60 text-center mb-4">
        Enter your new password below.
      </p>

      {error && (
        <div className="text-error p-1 mb-2">
          {error}
          {error.includes('invalid or expired') && (
            <>
              {' '}
              <Link className="link" href="/auth/forgot-password">
                Request a new one.
              </Link>
            </>
          )}
        </div>
      )}

      <div className="card-actions flex flex-col gap-2">
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

        {isProcessing ? (
          <div className="justify-center w-full flex m-4">
            <span className="loading loading-ring loading-lg"></span>
          </div>
        ) : (
          <>
            <button type="submit" className="btn btn-primary w-full">
              Reset Password
            </button>
            <Link
              className="link link-hover self-center"
              href="/auth/forgot-password"
            >
              Request a new link
            </Link>
          </>
        )}
      </div>
    </form>
  );
}
