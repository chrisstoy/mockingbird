'use client';
import { XMarkIcon } from '@heroicons/react/20/solid';
import { Key, PropsWithChildren, ReactNode } from 'react';

export interface DialogButton<_Result> {
  title: string;
  result?: _Result;
  intent?: 'primary' | 'secondary' | 'accent';
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
    <div className={`rounded-2xl card-title bg-primary text-primary-content`}>
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
  return <div className="card-body text-base-content">{children}</div>;
}

interface DialogButtonProps {
  title: DialogProps<unknown>['title'];
  onClick: () => void;
  intent?: DialogButton<unknown>['intent'];
  key?: Key | null | undefined;
}

export function DialogButton({
  title,
  onClick,
  intent,
  ...props
}: DialogButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`btn btn-sm bg-${intent ?? 'current'} text-${
        intent ?? 'current'
      }-content`}
      {...props}
    >
      {title}
    </button>
  );
}

export function DialogSubmitButton({
  title,
  intent,
  ...props
}: Omit<DialogButtonProps, 'onClick'>) {
  return (
    <button
      type="submit"
      className={`btn btn-sm bg-${intent ?? 'current'}`}
      {...props}
    >
      {title}
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
    <div className="card-actions justify-end p-1">
      {children}
      {buttons &&
        buttons.map(({ title, result, intent }, index) => (
          <DialogButton
            title={title}
            intent={intent}
            key={index}
            onClick={() => onClosed(result ?? defaultResult)}
          ></DialogButton>
        ))}
    </div>
  );
}