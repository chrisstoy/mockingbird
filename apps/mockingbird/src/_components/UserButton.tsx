/* eslint-disable @next/next/no-img-element */
'use client';
// import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
// import { ConfirmSignOutDialog } from '~/_components/ConfirmSignOutDialog';

export function UserButton() {
  const [showSignout, setShowSignout] = useState(false);
  // const { data: session } = useSession();
  const router = useRouter();

  const userName = 'Not Logged In';
  const email = '';
  const imageSrc = '';

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
      </ul>
      {/* {showSignout && (
        <ConfirmSignOutDialog
          onClosed={() => setShowSignout(false)}
        ></ConfirmSignOutDialog>
      )} */}
    </div>
  );
}
