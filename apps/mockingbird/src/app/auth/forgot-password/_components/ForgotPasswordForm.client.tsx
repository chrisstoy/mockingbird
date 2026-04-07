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
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-base-content">
            Check your inbox
          </h1>
          <p className="text-sm text-base-content/60 mt-1">
            A reset link is on its way
          </p>
        </div>
        <div role="alert" className="alert alert-success">
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
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-sm">
            If that email exists, a reset link was sent. Check your inbox and
            spam folder.
          </span>
        </div>
        <Link className="btn btn-outline w-full" href="/auth/signin">
          Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-base-content">
          Forgot Password
        </h1>
        <p className="text-sm text-base-content/60 mt-1">
          Enter your email and we&apos;ll send a reset link.
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
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="form-control w-full">
          <input
            type="email"
            className="input input-bordered w-full"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isProcessing}
          />
        </div>

        {isProcessing ? (
          <div className="flex items-center justify-center gap-3 py-2">
            <span className="loading loading-spinner loading-sm text-primary" />
            <span className="text-sm text-base-content/60">Sending link...</span>
          </div>
        ) : (
          <button type="submit" className="btn btn-primary w-full">
            Send Reset Link
          </button>
        )}
      </form>

      <p className="text-center text-sm text-base-content/60">
        Remember it?{' '}
        <Link className="text-primary font-semibold hover:underline" href="/auth/signin">
          Sign in
        </Link>
      </p>
    </div>
  );
}
