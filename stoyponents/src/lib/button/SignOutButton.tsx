'use client';
import { useState } from 'react';
import { ConfirmSignOutDialog } from '../dialog/ConfirmSignOutDialog';

export function SignOutButton() {
  const [showSignout, setShowSignout] = useState(false);

  return (
    <>
      <button className="btn btn-warning" onClick={() => setShowSignout(true)}>
        Sign Out
      </button>

      {showSignout && (
        <ConfirmSignOutDialog
          onClosed={() => setShowSignout(false)}
        ></ConfirmSignOutDialog>
      )}
    </>
  );
}
