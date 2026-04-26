'use client';
import { changePassword } from '@/_apiServices/users';
import type { UserId } from '@/_types';
import Link from 'next/link';
import { useState } from 'react';

interface Props {
  userId: UserId;
}

export function ChangePasswordForm({ userId }: Props) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setIsProcessing(true);

    try {
      const res = await changePassword(userId, currentPassword, newPassword);

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }

      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full flex flex-col gap-3"
      autoComplete="off"
    >
      {success && (
        <div className="alert alert-success">
          <span>Password changed successfully.</span>
        </div>
      )}

      {error && <div className="text-error p-1">{error}</div>}

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
        <div className="flex justify-center py-4">
          <span className="loading loading-ring loading-lg"></span>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <button type="submit" className="btn btn-primary w-full">
            Change Password
          </button>
          <Link href="/profile" className="link link-hover self-center">
            Cancel
          </Link>
        </div>
      )}
    </form>
  );
}
