import { BackButton } from '@/_components/BackButton.client';
import Link from 'next/link';

export function PostNotFound() {
  return (
    <div className="flex flex-col flex-auto bg-transparent">
      <BackButton />
      <div className="flex flex-col items-center justify-center flex-auto py-16 px-4 relative overflow-hidden">
        {/* Torn paper texture lines */}
        <div aria-hidden="true" className="absolute inset-x-0 top-1/3 flex flex-col gap-[3px] opacity-[0.06] pointer-events-none">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-px bg-base-content"
              style={{ marginLeft: `${i * 7}%`, marginRight: `${(4 - i) * 5}%` }}
            />
          ))}
        </div>

        {/* Card */}
        <div
          className="relative z-10 flex flex-col items-center gap-6 max-w-sm w-full"
          style={{
            animation: 'pnf-rise 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
          }}
        >
          {/* Text */}
          <div className="text-center flex flex-col gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-base-content">
              Post not found
            </h1>
            <p className="text-sm text-base-content/50 leading-relaxed max-w-[26ch] mx-auto">
              This post may have been deleted or the link is incorrect.
            </p>
          </div>

          {/* Divider with amber dot */}
          <div className="flex items-center gap-3 w-full">
            <div className="flex-1 h-px bg-base-content/10" />
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: 'var(--color-primary)' }}
            />
            <div className="flex-1 h-px bg-base-content/10" />
          </div>

          {/* CTA */}
          <Link
            href="/"
            className="btn btn-primary btn-sm rounded-full px-6 font-semibold tracking-wide"
          >
            Back to feed
          </Link>
        </div>

        <style>{`
          @keyframes pnf-rise {
            from { opacity: 0; transform: translateY(12px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </div>
  );
}
