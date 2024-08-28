/* eslint-disable @next/next/no-img-element */
'use client';
import {
  ConfirmationDialogResult,
  ConfirmSignOutDialog,
} from '@mockingbird/stoyponents';
import { signIn, signOut, useSession } from 'next-auth/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function UserButton() {
  const { data: session } = useSession();
  const router = useRouter();

  const [showSignout, setShowSignout] = useState(false);

  const userName = session?.user?.name ?? 'Not Logged In';
  const email = session?.user?.email ?? '';
  const imageSrc = session?.user?.image ?? '/generic-user-icon.jpg';

  function handleSignOutResponse(
    result?: ConfirmationDialogResult | undefined
  ) {
    setShowSignout(false);
    if (result === 'ok') {
      signOut();
    }
  }

  function handleSignIn() {
    signIn(undefined, { callbackUrl: '/' });
  }

  return (
    <div className="dropdown dropdown-end">
      <label
        tabIndex={0}
        className="btn btn-circle overflow-hidden tooltip"
        data-tip={userName}
      >
        <Image src={imageSrc} alt="User Profile" width={50} height={50}></Image>
      </label>
      <ul
        tabIndex={0}
        className="menu dropdown-content z-[1] w-52 mt-4 p-2 shadow bg-base-100 text-base-content"
      >
        <div className="menu-title">
          <span className="flex flex-col items-start ">
            <div className="font-extrabold text-lg">{userName}</div>
            <div className="text-xs">{email}</div>
          </span>
          <hr className="m-1"></hr>
        </div>
        {session?.user ? (
          <>
            <li>
              <span
                onClick={() => {
                  (document.activeElement as HTMLElement | undefined)?.blur();
                  router.push('/profile');
                }}
              >
                Profile
              </span>
            </li>
            <li>
              <span onClick={() => setShowSignout(true)}>Sign Out</span>
            </li>
          </>
        ) : (
          <li>
            <span onClick={handleSignIn}>Sign In</span>
          </li>
        )}
      </ul>
      {showSignout && (
        <ConfirmSignOutDialog
          onClosed={handleSignOutResponse}
        ></ConfirmSignOutDialog>
      )}
    </div>
  );
}
