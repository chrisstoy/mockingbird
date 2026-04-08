'use client';
import { XMarkIcon } from '@heroicons/react/20/solid';
import { Key, PropsWithChildren, ReactNode } from 'react';

export interface DialogButton<_Result> {
  title: string;
  result?: _Result;
  intent?: 'primary' | 'secondary' | 'accent' | 'warning' | 'error';
  disabled?: boolean;
}

export interface DialogProps<_Result> extends PropsWithChildren {
  title: ReactNode;
  defaultResult?: _Result;
  buttons?: Array<DialogButton<_Result>>;
  width?: string;
  maxWidth?: string;
  onClosed: (result?: _Result) => void;
}

export function DialogHeader<_Result>({
  title,
  onClosed,
}: Pick<DialogProps<_Result>, 'title' | 'onClosed'>) {
  return (
    <div className="flex-none flex items-center justify-between px-5 py-4 border-b border-base-200">
      <h2 className="font-bold text-base text-base-content leading-none">
        {title}
      </h2>
      <button
        className="w-7 h-7 rounded-full flex items-center justify-center text-base-content/40 hover:text-base-content hover:bg-base-200 transition-colors"
        onClick={() => onClosed()}
        aria-label="Close"
      >
        <XMarkIcon className="w-4 h-4" />
      </button>
    </div>
  );
}

export function DialogBody({ children }: PropsWithChildren) {
  return (
    <div className="flex-auto bg-base-100 text-base-content">{children}</div>
  );
}

interface DialogButtonProps extends PropsWithChildren {
  onClick: () => void;
  intent?: DialogButton<unknown>['intent'];
  key?: Key | null | undefined;
  disabled?: boolean;
  className?: string;
}

export function DialogButton({
  onClick,
  intent,
  disabled,
  className,
  children,
  ...props
}: DialogButtonProps) {
  const intentClass = intent ? `btn-${intent}` : 'btn-ghost';
  return (
    <button
      disabled={disabled}
      type="button"
      onClick={onClick}
      className={`btn btn-sm ${intentClass} ${className ?? ''}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function DialogSubmitButton({
  intent,
  className,
  children,
  ...props
}: Omit<DialogButtonProps, 'onClick'>) {
  const intentClass = intent ? `btn-${intent}` : 'btn-primary';
  return (
    <button
      type="submit"
      className={`btn btn-sm ${intentClass} ${className ?? ''}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function DialogActions<_Result>({
  buttons,
  onClosed,
  defaultResult,
  children,
}: Pick<
  DialogProps<_Result>,
  'buttons' | 'onClosed' | 'defaultResult' | 'children'
>) {
  return (
    <div className="flex-none flex items-center justify-end gap-2 px-4 py-3 border-t border-base-200 bg-base-100 rounded-b-2xl">
      {children}
      {buttons &&
        buttons.map(({ title, result, intent, disabled }, index) => (
          <DialogButton
            disabled={disabled}
            intent={intent}
            key={index}
            onClick={() => onClosed(result ?? defaultResult)}
          >
            {title}
          </DialogButton>
        ))}
    </div>
  );
}
