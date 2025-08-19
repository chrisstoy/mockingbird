'use client';

import { Audience, audienceValues } from '@/_types';
import { toCapitalized } from '@/_utils/toCapitalized';
import { useRef, useState } from 'react';

interface Props {
  disabled: boolean;
  audience: Audience;
  onChange: (audience: Audience) => void;
}

export function AudienceSelector({
  disabled,
  audience: initialAudience = 'PUBLIC',
  onChange,
}: Props) {
  const [audience, setAudience] = useState<Audience>(initialAudience);

  const dropdownRef = useRef<HTMLDetailsElement>(null);

  const handleChange = (selected: Audience) => {
    setAudience(selected);
    dropdownRef.current?.removeAttribute('open');
    onChange(selected);
  };

  return (
    <>
      {disabled ? (
        <div className="font-semibold self-center text-sm px-4">
          {toCapitalized(audience)}
        </div>
      ) : (
        <details
          aria-disabled={disabled}
          className="dropdown dropdown-top dropdown-end"
          ref={dropdownRef}
        >
          <summary className="btn btn-ghost">{toCapitalized(audience)}</summary>
          <ul className="menu dropdown-content bg-base-100 rounded-box z-1 p-2 shadow-sm">
            {audienceValues.map((option) => (
              <li key={option} onClick={() => handleChange(option)}>
                <a>{toCapitalized(option)}</a>
              </li>
            ))}
          </ul>
        </details>
      )}
    </>
  );
}
