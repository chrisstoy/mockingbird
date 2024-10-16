'use client';
import { EllipsisHorizontalIcon } from '@heroicons/react/24/solid';
import { ReactNode } from 'react';

export function MenuButton({ children }: { children: ReactNode }) {
  return (
    <div className="dropdown dropdown-left">
      <div tabIndex={0} role="button" className="btn btn-circle btn-xs p-1">
        <EllipsisHorizontalIcon></EllipsisHorizontalIcon>
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content menu bg-base-100 rounded-box z-[1] p-2 shadow"
      >
        {children}
      </ul>
    </div>
  );
}
