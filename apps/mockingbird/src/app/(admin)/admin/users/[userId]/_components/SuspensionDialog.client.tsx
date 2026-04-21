'use client';
import { FormDialog } from '@/_components/dialog';
import { useEffect, useRef, useState } from 'react';

interface SuspensionDialogResult {
  suspended: boolean;
  reason?: string;
}

interface SuspensionDialogProps {
  onClosed: (result: SuspensionDialogResult) => void;
}

export function SuspensionDialog({ onClosed }: SuspensionDialogProps) {
  const [reason, setReason] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  async function handleSubmit() {
    onClosed({ suspended: true, reason: reason.trim() });
  }

  function handleCancel() {
    onClosed({ suspended: false });
  }

  return (
    <FormDialog
      title="Suspend Account"
      description="Provide a clear explanation for this action"
      defaultResult={{ suspended: false }}
      onClosed={handleCancel}
      onSubmit={handleSubmit}
      submitLabel="Suspend Account"
      submitIntent="warning"
      submitDisabled={!reason.trim()}
      cancelLabel="Cancel"
      footerHint={
        <>
          <kbd className="kbd kbd-xs">⌘</kbd> +{' '}
          <kbd className="kbd kbd-xs">↵</kbd> to confirm
        </>
      }
      maxWidth="32rem"
    >
      <label className="block">
        <span className="text-xs font-medium tracking-wider uppercase text-base-content/40 mb-2 block">
          Reason for Suspension
        </span>
        <textarea
          ref={textareaRef}
          className="textarea textarea-bordered w-full min-h-32 text-sm leading-relaxed"
          placeholder="e.g., Violated community guidelines by posting spam content on multiple occasions..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </label>
      <p className="text-xs text-base-content/40 mt-2">
        This message will be shown to the user when they attempt to log in.
      </p>
    </FormDialog>
  );
}
