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
    <form onSubmit={handleSubmit} className="flex flex-col" autoComplete="off">
      <h1 className="text-2xl text-center mb-2">Password Expired</h1>

      <div className="alert alert-warning mb-4">
        <span>Your password has expired and must be changed.</span>
      </div>

      {error && <div className="text-error p-1 mb-2">{error}</div>}

      <div className="card-actions flex flex-col gap-2">
        <input
          type="password"
          className="input input-bordered w-full"
          placeholder="Current password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          disabled={isProcessing}
        />
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
          <button type="submit" className="btn btn-primary w-full">
            Change Password
          </button>
        )}
      </div>
    </form>
  );
}
