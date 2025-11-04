'use client';

import { deleteUser } from '@/_apiServices/users';
import { useSessionUser } from '@/_hooks/useSessionUser';
import {
  ConfirmationDialog,
  ConfirmationDialogResult,
} from '@mockingbird/stoyponents';
import { createClient } from '@/_utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import {
  FinalConfirmDeleteUserDialog,
  InitialConfirmDeleteUserDialog,
} from './ConfirmDeleteUserDialog.client';

export function DeleteAccountButton() {
  const user = useSessionUser();
  const router = useRouter();
  const supabase = createClient();
  const [showFirstConfirmDelete, setShowFirstConfirmDelete] = useState(false);
  const [showFinalConfirmDelete, setShowFinalConfirmDelete] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  const handleFirstConfirmDeleteResponse = useCallback(
    (result?: ConfirmationDialogResult | undefined) => {
      setShowFirstConfirmDelete(false);
      if (result === 'ok') {
        setShowFinalConfirmDelete(true);
      }
    },
    [setShowFirstConfirmDelete, setShowFinalConfirmDelete]
  );

  const handleFinalConfirmDeleteResponse = useCallback(
    (result?: ConfirmationDialogResult | undefined) => {
      setShowFinalConfirmDelete(false);

      if (!user?.id) {
        console.error('Cannot delete user: No user id found');
        return;
      }

      if (result === 'ok') {
        setIsDeletingUser(true);
        (async () => {
          try {
            await deleteUser(user.id);
          } catch (error) {
            console.error(error);
          }
          // Sign out from Supabase Auth
          await supabase.auth.signOut();
          router.push('/auth/signin');
          router.refresh();
        })();
      }
    },
    [setShowFinalConfirmDelete, user?.id]
  );

  return (
    <>
      {user?.id && (
        <button
          className="btn btn-error btn-sm btn-link"
          onClick={() => {
            setShowFirstConfirmDelete(true);
          }}
        >
          Delete Account
        </button>
      )}

      {showFirstConfirmDelete && (
        <InitialConfirmDeleteUserDialog
          onClosed={handleFirstConfirmDeleteResponse}
        ></InitialConfirmDeleteUserDialog>
      )}

      {showFinalConfirmDelete && (
        <FinalConfirmDeleteUserDialog
          onClosed={handleFinalConfirmDeleteResponse}
        ></FinalConfirmDeleteUserDialog>
      )}

      {isDeletingUser && (
        <ConfirmationDialog
          title={`Deleting User`}
          onClosed={() => {
            /* Do nothing */
          }}
        >
          <div className="">
            <p className="flex justify-center mb-2 font-semibold">
              Deleting {user?.name}
            </p>
            <p className="flex justify-center">Please Wait...</p>
          </div>
        </ConfirmationDialog>
      )}
    </>
  );
}
