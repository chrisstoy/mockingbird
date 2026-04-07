import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export function RightSidebar() {
  return (
    <aside className="w-60 fixed right-0 top-14 h-[calc(100vh-3.5rem-2.5rem)] hidden lg:flex flex-col px-6 py-6 bg-base-100 border-l border-base-200 z-40 overflow-y-auto gap-6">
      {/* Search */}
      <div className="relative">
        <input
          type="text"
          className="w-full bg-base-200 border-none rounded-full py-3 pl-12 pr-5 text-sm text-base-content placeholder:text-base-content/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="Search the flock..."
          readOnly
        />
        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
      </div>

      {/* Who to follow */}
      <div className="bg-base-200 rounded-xl p-5">
        <h2 className="text-lg font-extrabold mb-4 tracking-tight text-base-content">
          Who to follow
        </h2>
        <Link
          href="/friends"
          className="text-primary font-semibold text-sm hover:underline"
        >
          Find friends →
        </Link>
      </div>

      {/* Footer */}
      <footer className="text-xs text-base-content/40 flex flex-wrap gap-x-3 gap-y-1 mt-auto pt-2"></footer>
    </aside>
  );
}
