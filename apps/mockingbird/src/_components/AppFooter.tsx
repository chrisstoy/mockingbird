import Link from 'next/link';

export function AppFooter() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 h-10 hidden lg:flex items-center justify-center z-40 bg-base-100 border-t border-base-200">
      {/* <Version></Version> */}

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
