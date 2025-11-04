'use client';

import {
  ConfirmationDialogResult,
  ConfirmSignOutDialog,
} from '@mockingbird/stoyponents';
import { createClient } from '@/_utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function SignOutButton() {
  const [showSignout, setShowSignout] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOutResponse(
    result?: ConfirmationDialogResult | undefined
  ) {
    setShowSignout(false);
    if (result === 'ok') {
      await supabase.auth.signOut();
      router.push('/');
      router.refresh();
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
