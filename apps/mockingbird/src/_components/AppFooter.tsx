import { env } from '@/../env';
import version from '@/../version.json';
import Link from 'next/link';

export function AppFooter() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 h-10 hidden lg:flex items-center justify-center z-40 bg-base-100 border-t border-base-200">
      <p className="text-[10px] text-base-content/30 tracking-widest uppercase font-semibold">
        Mockingbird {version.version} - {env.VERCEL_ENV || env.NODE_ENV} -
        {` - Built: ${new Date(version.buildDate).toUTCString()}`}
        {env.VERCEL_GIT_COMMIT_REF ? ` - ${env.VERCEL_GIT_COMMIT_REF}` : ''}
      </p>

      <div className="text-xs text-base-content/40 flex flex-wrap gap-x-3 gap-y-1 items-center absolute right-6">
        <Link href="/privacy/tos" className="hover:underline">
          Terms
        </Link>
        <Link href="/privacy/policy" className="hover:underline">
          Privacy
        </Link>
      </div>
    </footer>
  );
}
