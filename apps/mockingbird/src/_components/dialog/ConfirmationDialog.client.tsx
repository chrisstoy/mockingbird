'use client';
import { useEffect, useRef } from 'react';
import React from 'react';
import {
  DialogActions,
  DialogBody,
  DialogHeader,
  DialogProps,
} from './DialogBase';

export type ConfirmationDialogResult = 'ok' | 'cancel';

type Props = DialogProps<ConfirmationDialogResult>;

export function ConfirmationDialog({
  title,
  defaultResult,
  children,
  buttons,
  onClosed,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();

    return () => {
      dialog?.close();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="m-auto bg-transparent open:animate-fade-in open:backdrop:animate-fade-in backdrop:backdrop-blur-sm backdrop:bg-black/40"
    >
      <div className="w-88 rounded-2xl border border-base-200 shadow-2xl bg-base-100 flex flex-col overflow-hidden">
        <DialogHeader title={title} onClosed={() => onClosed(defaultResult)} />
        <DialogBody>
          <div className="px-5 py-4 flex flex-col gap-3 text-sm text-base-content/70 leading-relaxed">
            {children}
          </div>
        </DialogBody>
        <DialogActions
          buttons={buttons}
          onClosed={onClosed}
          defaultResult={defaultResult}
        />
      </div>
    </dialog>
  );
}
