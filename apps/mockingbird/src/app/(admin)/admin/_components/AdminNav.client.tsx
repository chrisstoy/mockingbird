'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
}

export function AdminNav({ items }: { items: readonly NavItem[] }) {
  const pathname = usePathname();

  return (
    <ul className="space-y-0.5">
      {items.map((item) => {
        const isActive =
          item.href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(item.href);

        return (
          <li key={item.href} className="relative">
            {isActive && (
              <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r bg-white/60" />
            )}
            <Link
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-white/10 text-white font-medium'
                  : 'text-neutral-content/40 hover:text-neutral-content/70 hover:bg-white/5'
              }`}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
