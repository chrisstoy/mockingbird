'use client';
import { type ThemeMode, useTheme } from '@/_providers/ThemeProvider.client';
import { ComputerDesktopIcon, MoonIcon, SunIcon } from '@heroicons/react/24/outline';

const options: { mode: ThemeMode; label: string; icon: React.ReactNode }[] = [
  { mode: 'light', label: 'Light', icon: <SunIcon className="w-4 h-4" /> },
  { mode: 'dark', label: 'Dark', icon: <MoonIcon className="w-4 h-4" /> },
  { mode: 'system', label: 'System', icon: <ComputerDesktopIcon className="w-4 h-4" /> },
];

export function ThemeSwitcher() {
  const { mode, setMode } = useTheme();

  return (
    <div className="flex gap-1 bg-base-200 rounded-xl p-1">
      {options.map((opt) => (
        <button
          key={opt.mode}
          type="button"
          onClick={() => setMode(opt.mode)}
          aria-label={opt.label}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            mode === opt.mode
              ? 'bg-base-100 text-base-content shadow-sm'
              : 'text-base-content/50 hover:text-base-content'
          }`}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  );
}
