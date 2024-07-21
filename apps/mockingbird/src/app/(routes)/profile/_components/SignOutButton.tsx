'use client';
import { useState } from 'react';
import { ConfirmSignOutDialog } from '@/_components/ConfirmSignOutDialog';

export function SignOutButton() {
  const [showSignout, setShowSignout] = useState(false);

  return (
    <>
      <button className="btn btn-primary" onClick={() => setShowSignout(true)}>
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
