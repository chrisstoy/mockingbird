import Link from 'next/link';

export function RightSidebar() {
  return (
    <aside className="w-60 fixed right-0 top-14 h-[calc(100vh-3.5rem-2.5rem)] hidden lg:flex flex-col px-6 py-6 bg-base-100 border-l border-base-200 z-40 overflow-y-auto gap-6">
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
