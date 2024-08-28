'use client';

import {
  ConfirmationDialogResult,
  ConfirmSignOutDialog,
} from '@mockingbird/stoyponents';
import { signOut } from 'next-auth/react';
import { useState } from 'react';

export function SignOutButton() {
  const [showSignout, setShowSignout] = useState(false);

  function handleSignOutResponse(
    result?: ConfirmationDialogResult | undefined
  ) {
    setShowSignout(false);
    if (result === 'ok') {
      signOut();
    }
  }

  return (
    <>
      <button className="btn btn-warning" onClick={() => setShowSignout(true)}>
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
