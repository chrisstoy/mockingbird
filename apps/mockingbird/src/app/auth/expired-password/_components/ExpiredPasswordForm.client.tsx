'use client';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Props {
  email: string;
}

export function ExpiredPasswordForm({ email }: Props) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setIsProcessing(true);

    try {
      const res = await fetch('/api/auth/change-expired-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }

      const userEmail = data.email as string;
      await signIn('credentials', {
        email: userEmail,
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

  return (
    <div className="flex flex-col gap-6">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-base-content">
          Update Password
        </h1>
        <p className="text-sm text-base-content/60 mt-1">
          Your password has expired and must be changed to continue.
        </p>
      </div>

      <div role="alert" className="alert alert-warning">
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
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <span className="text-sm">Password expired for {email}</span>
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
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <div className="form-control w-full">
            <input
              type="password"
              className="input input-bordered w-full"
              placeholder="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              disabled={isProcessing}
            />
          </div>
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
            Change Password
          </button>
        )}
      </form>
    </div>
  );
}
