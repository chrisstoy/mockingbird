'use client';

import { useSessionUser } from '@/_hooks/useSessionUser';
import {
  ConfirmationDialog,
  ConfirmationDialogResult,
} from '@mockingbird/stoyponents';
import { useEffect, useState } from 'react';

interface Props {
  onClosed: (result: ConfirmationDialogResult) => void;
}

export function InitialConfirmDeleteUserDialog({ onClosed }: Props) {
  const user = useSessionUser();

  function handleSignOut(result?: ConfirmationDialogResult) {
    onClosed(result ?? 'cancel');
  }

  const [email, setEmail] = useState('');
  const [enableDelete, setEnableDelete] = useState(false);

  useEffect(() => {
    setEnableDelete(
      email.toLocaleLowerCase() === user?.email.toLocaleLowerCase()
    );
  }, [user, email]);

  return (
    <ConfirmationDialog
      title={`Delete Account?`}
      defaultResult={'cancel'}
      buttons={[
        { title: 'Delete Account', result: 'ok', disabled: !enableDelete },
        { title: 'Cancel', intent: 'primary', result: 'cancel' },
      ]}
      onClosed={handleSignOut}
    >
      Enter your email address to confirm you want to delete your account.
      <input
        type="text"
        placeholder="Email"
        className="input input-bordered w-full"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
    </ConfirmationDialog>
  );
}

export function FinalConfirmDeleteUserDialog({ onClosed }: Props) {
  function handleSignOut(result?: ConfirmationDialogResult) {
    onClosed(result ?? 'cancel');
  }

  return (
    <ConfirmationDialog
      title={`Final Chance: Delete Account?`}
      defaultResult={'cancel'}
      buttons={[
        { title: 'Delete Account', result: 'ok' },
        { title: 'Cancel', intent: 'primary', result: 'cancel' },
      ]}
      onClosed={handleSignOut}
    >
      <p>
        This is your last chance. Are you SURE you want to delete your account?
      </p>
      <p>
        All Posts, Comments, Friendships, and Data will be{' '}
        <span className="font-bold">PERMANENTLY DELETED</span>.
      </p>
      <p className="text-warning font-extrabold text-2xl flex justify-center">
        This can NOT be undone!
      </p>
    </ConfirmationDialog>
  );
}
