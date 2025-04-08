'use client';
import { XMarkIcon } from '@heroicons/react/20/solid';
import { Key, PropsWithChildren, ReactNode } from 'react';

export interface DialogButton<_Result> {
  title: string;
  result?: _Result;
  intent?: 'primary' | 'secondary' | 'accent';
  disabled?: boolean;
}

export interface DialogProps<_Result> extends PropsWithChildren {
  title: ReactNode; //=>
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
    <div
      className={`flex-none block rounded-t-2xl bg-primary text-primary-content`}
    >
      <div
        className={
          'flex w-full px-5 font-bold py-4 items-center justify-between text-xl'
        }
      >
        {title}
        <button
          className="flex-grow-0 flex-shrink-0 border-1 w-5"
          onClick={() => onClosed()}
        >
          <XMarkIcon></XMarkIcon>
        </button>
      </div>
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
  return (
    <button
      disabled={disabled}
      type="button"
      onClick={onClick}
      className={`${className} btn btn-sm bg-${intent ?? 'current'} text-${
        intent ?? 'current'
      }-content`}
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
  return (
    <button
      type="submit"
      className={`${className} btn btn-sm bg-${intent ?? 'current'}`}
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
    <div className="flex-none flex rounded-b-2xl bg-primary text-primary-content justify-end p-2">
      {children}
      {buttons &&
        buttons.map(({ title, result, intent, disabled }, index) => (
          <DialogButton
            className="m-1"
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
