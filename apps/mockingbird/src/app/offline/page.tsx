import Image from 'next/image';
import { RetryButton } from './RetryButton.client';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-base-100 flex flex-col items-center justify-center gap-6 px-4 text-center">
      <Image
        src="/images/mockingbird-logo.png"
        alt="Mockingbird"
        width={96}
        height={96}
        priority
      />
      <h1 className="text-2xl font-bold text-base-content">You're offline</h1>
      <p className="text-base-content/70 max-w-xs">
        Check your connection and try again.
      </p>
      <RetryButton />
    </div>
  );
}
