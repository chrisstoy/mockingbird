'use client';

import { useState } from 'react';

export function ResendVerificationButton() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  async function handleResend() {
    setStatus('loading');
    try {
      const res = await fetch('/api/auth/resend-verification', { method: 'POST' });
      if (res.ok) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        className="btn btn-primary"
        onClick={handleResend}
        disabled={status === 'loading' || status === 'success'}
      >
        {status === 'loading' ? 'Sending...' : 'Resend verification email'}
      </button>
      {status === 'success' && (
        <p className="text-success text-sm">Verification email sent! Check your inbox.</p>
      )}
      {status === 'error' && (
        <p className="text-error text-sm">Failed to send email. Please try again.</p>
      )}
    </div>
  );
}
