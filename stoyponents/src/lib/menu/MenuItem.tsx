'use client';

import React from 'react';

export function MenuItem({
  title,
  onClick,
}: {
  title: string;
  onClick: () => void;
}) {
  return (
    <li>
      <a
        className="w-full"
        onClick={() => {
          (document.activeElement as HTMLElement | undefined)?.blur();
          onClick();
        }}
      >
        {title}
      </a>
    </li>
  );
}
