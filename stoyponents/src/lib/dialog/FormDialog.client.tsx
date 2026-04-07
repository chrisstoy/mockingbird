'use client';
import { PropsWithChildren, ReactNode, useEffect, useRef, useState } from 'react';
import {
  DialogActions,
  DialogBody,
  DialogButton,
  DialogHeader,
  DialogSubmitButton,
} from './DialogBase';

export interface FormDialogProps<Result> extends PropsWithChildren {
  title: ReactNode;
  description?: string;
  defaultResult?: Result;
  onClosed: (result?: Result) => void;
  onSubmit: () => Promise<void> | void;
  submitLabel?: string;
  submitIntent?: 'primary' | 'secondary' | 'accent' | 'warning' | 'error';
  submitDisabled?: boolean;
  cancelLabel?: string;
  footerHint?: ReactNode;
  maxWidth?: string;
}

export function FormDialog<Result>({
  title,
  description,
  defaultResult,
  children,
  onClosed,
  onSubmit,
  submitLabel = 'Submit',
  submitIntent = 'primary',
  submitDisabled = false,
  cancelLabel = 'Cancel',
  footerHint,
  maxWidth = '32rem',
}: FormDialogProps<Result>) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();

    return () => {
      dialog?.close();
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitDisabled || saving) return;

    setSaving(true);
    try {
      await onSubmit();
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    if (!saving) {
      onClosed(defaultResult);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="m-auto bg-transparent open:animate-fade-in open:backdrop:animate-fade-in backdrop:backdrop-blur-sm backdrop:bg-black/40"
      style={{ maxWidth }}
    >
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-base-200 shadow-2xl bg-base-100 flex flex-col overflow-hidden"
      >
        <DialogHeader title={title} onClosed={handleCancel} />
        <DialogBody>
          <div className="px-5 py-4 flex flex-col gap-3">
            {description && (
              <p className="text-xs text-base-content/50">{description}</p>
            )}
            {children}
          </div>
        </DialogBody>
        <DialogActions onClosed={handleCancel} defaultResult={defaultResult}>
          {footerHint && (
            <div className="text-xs text-base-content/40 mr-auto">
              {footerHint}
            </div>
          )}
          <DialogButton onClick={handleCancel} disabled={saving}>
            {cancelLabel}
          </DialogButton>
          <DialogSubmitButton
            intent={submitIntent}
            disabled={submitDisabled || saving}
          >
            {saving ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              submitLabel
            )}
          </DialogSubmitButton>
        </DialogActions>
      </form>
    </dialog>
  );
}
