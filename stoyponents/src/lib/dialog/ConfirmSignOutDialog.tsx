'use client';
import { signOut } from 'next-auth/react';
import {
  ConfirmationDialog,
  ConfirmationDialogResult,
} from './ConfirmationDialog';

interface Props {
  onClosed: (result: ConfirmationDialogResult | undefined) => void;
}

export function ConfirmSignOutDialog({ onClosed }: Props) {
  function handleSignOut(result?: ConfirmationDialogResult) {
    if (result === 'ok') {
      signOut({ callbackUrl: '/' });
    }
    onClosed(result);
  }
  return (
    <ConfirmationDialog
      title={`Sign Out?`}
      defaultResult={'cancel'}
      buttons={[
        { title: 'Sign Out', result: 'ok' },
        { title: 'Cancel', intent: 'primary' },
      ]}
      onClosed={handleSignOut}
    >
      Are you sure you want to sign out?
    </ConfirmationDialog>
  );
}
