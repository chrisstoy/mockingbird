'use client';
import { useSessionUser } from '@/_hooks/useSessionUser';
import { GENERIC_USER_IMAGE_URL } from '@/constants';
import {
  ConfirmationDialogResult,
  ConfirmSignOutDialog,
} from '@mockingbird/stoyponents';
import { signIn, signOut } from 'next-auth/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

function MenuItem({ title, onClick }: { title: string; onClick: () => void }) {
  return (
    <li>
      <span
        className="w-full"
        onClick={() => {
          (document.activeElement as HTMLElement | undefined)?.blur();
          onClick();
        }}
      >
        {title}
      </span>
    </li>
  );
}

export function UserButton() {
  const user = useSessionUser();
  const router = useRouter();

  const [showSignout, setShowSignout] = useState(false);

  const [userData, setUserData] = useState<{
    name: string;
    email: string;
    image: string;
  }>({
    name: 'Not Logged In',
    email: '',
    image: GENERIC_USER_IMAGE_URL,
  });

  useEffect(() => {
    setUserData({
      name: user?.name ?? 'Not Logged In',
      email: user?.email ?? '',
      image: user?.image ?? GENERIC_USER_IMAGE_URL,
    });
  }, [user]);

  function handleSignOutResponse(
    result?: ConfirmationDialogResult | undefined
  ) {
    setShowSignout(false);
    if (result === 'ok') {
      signOut({ callbackUrl: '/' });
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
        data-tip={userData.name}
      >
        <Image
          src={userData.image}
          alt="User Profile"
          width={50}
          height={50}
        ></Image>
      </label>
      <ul
        tabIndex={0}
        className="menu dropdown-content z-[1] w-52 mt-4 p-2 shadow bg-base-100 text-base-content"
      >
        <div className="menu-title">
          <span className="flex flex-col items-start ">
            <div className="font-extrabold text-lg">{userData.name}</div>
            <div className="text-xs">{userData.email}</div>
          </span>
          <hr className="m-1"></hr>
        </div>
        {user ? (
          <>
            <MenuItem title="Friends" onClick={() => router.push('/friends')} />
            <MenuItem title="Profile" onClick={() => router.push('/profile')} />
            {user.permissions?.includes('admin:access') && (
              <>
                <hr className="m-1" />
                <MenuItem
                  title="Admin"
                  onClick={() => router.push('/admin')}
                />
              </>
            )}
            <hr className="m-1"></hr>
            <MenuItem
              title="Data & Privacy"
              onClick={() => router.push('/privacy')}
            />
            <hr className="m-1"></hr>
            <MenuItem title="Sign Out" onClick={() => setShowSignout(true)} />
          </>
        ) : (
          <MenuItem title="Sign In" onClick={handleSignIn} />
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
