'use client';
import { adminCleanupPendingAccounts } from '@/_apiServices/admin';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Props = {
  expiredCount: number;
};

export function CleanupPendingButton({ expiredCount }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleCleanup() {
    setLoading(true);
    try {
      await adminCleanupPendingAccounts();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-base-content/50">
        {expiredCount} expired pending confirmation
        {expiredCount !== 1 ? 's' : ''}
      </span>
      &nbsp;
      <button
        onClick={handleCleanup}
        disabled={loading || expiredCount === 0}
        className="btn btn-xs btn-error btn-outline"
      >
        {loading ? 'Cleaning up…' : 'Clean up'}
      </button>
    </div>
  );
}
