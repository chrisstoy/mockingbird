'use client';

import {
  ConfirmationDialogResult,
  ConfirmSignOutDialog,
} from '@/_components/dialog';
import { signOut } from 'next-auth/react';
import { useState } from 'react';

export function SignOutButton() {
  const [showSignout, setShowSignout] = useState(false);

  function handleSignOutResponse(
    result?: ConfirmationDialogResult | undefined
  ) {
    setShowSignout(false);
    if (result === 'ok') {
      signOut({ callbackUrl: '/' });
    }
  }

  return (
    <>
      <button className="btn btn-warning btn-sm" onClick={() => setShowSignout(true)}>
        Sign Out
      </button>

      {showSignout && (
        <ConfirmSignOutDialog
          onClosed={handleSignOutResponse}
        ></ConfirmSignOutDialog>
      )}
    </>
  );
}
