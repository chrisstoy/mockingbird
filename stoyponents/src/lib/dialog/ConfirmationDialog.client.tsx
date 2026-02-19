'use client';
import { useEffect, useRef } from 'react';
import {
  DialogActions,
  DialogBody,
  DialogHeader,
  DialogProps,
} from './DialogBase';
import React from 'react';

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
      className="m-auto bg-transparent open:animate-fade-in open:backdrop:animate-fade-in"
    >
      <div className="card card-bordered shadow-xl bg-base-100">
        <DialogHeader title={title} onClosed={onClosed}></DialogHeader>
        <DialogBody>
          <div className="m-4">{children}</div>
        </DialogBody>
        <DialogActions
          buttons={buttons}
          onClosed={onClosed}
          defaultResult={defaultResult}
        ></DialogActions>
      </div>
    </dialog>
  );
}
