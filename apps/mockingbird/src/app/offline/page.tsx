import { RetryButton } from './RetryButton.client';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-base-100 flex flex-col items-center justify-center gap-6 px-4 text-center">
      {/* Use plain img — next/image requires the server, which won't be available offline */}
      { }
      <img
        src="/images/mockingbird-logo.png"
        alt="Mockingbird"
        width={80}
        height={80}
        className="opacity-80"
      />
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold tracking-widest uppercase text-base-content/40">
          Mockingbird
        </span>
        <h1 className="text-2xl font-bold text-base-content">You&apos;re offline</h1>
      </div>
      <p className="text-base-content/60 max-w-xs text-sm">
        Check your connection and try again.
      </p>
      <RetryButton />
    </div>
  );
}
