'use client';
import Link from 'next/link';
import { useState } from 'react';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsProcessing(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        setError(data.error ?? 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center text-center gap-4">
        <h1 className="text-2xl mb-2">Check your inbox</h1>
        <div className="alert alert-success w-full">
          <span>
            If that email exists, a reset link was sent. Check your inbox.
          </span>
        </div>
        <Link className="link link-hover" href="/auth/signin">
          Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col" autoComplete="off">
      <h1 className="text-2xl text-center mb-2">Forgot Password</h1>
      <p className="text-sm text-base-content/60 text-center mb-4">
        Enter your email and we&apos;ll send you a reset link.
      </p>

      {error && <div className="text-error p-1 mb-2">{error}</div>}

      <div className="card-actions flex flex-col gap-2">
        <input
          type="email"
          className="input input-bordered w-full"
          placeholder="user@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isProcessing}
        />

        {isProcessing ? (
          <div className="justify-center w-full flex m-4">
            <span className="loading loading-ring loading-lg"></span>
          </div>
        ) : (
          <>
            <button type="submit" className="btn btn-primary w-full">
              Send Reset Link
            </button>
            <Link
              className="link link-hover self-center"
              href="/auth/signin"
            >
              Back to Sign In
            </Link>
          </>
        )}
      </div>
    </form>
  );
}
