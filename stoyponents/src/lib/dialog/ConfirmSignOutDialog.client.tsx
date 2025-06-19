'use client';

import {
  ConfirmationDialog,
  ConfirmationDialogResult,
} from './ConfirmationDialog.client';

interface Props {
  onClosed: (result: ConfirmationDialogResult) => void;
}

export function ConfirmSignOutDialog({ onClosed }: Props) {
  function handleSignOut(result?: ConfirmationDialogResult) {
    onClosed(result ?? 'cancel');
  }

  return (
    <ConfirmationDialog
      title={`Sign Out?`}
      defaultResult={'cancel'}
      buttons={[
        { title: 'Sign Out', result: 'ok' },
        { title: 'Cancel', intent: 'primary', result: 'cancel' },
      ]}
      onClosed={handleSignOut}
    >
      Are you sure you want to sign out?
    </ConfirmationDialog>
  );
}
