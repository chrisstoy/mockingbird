/* eslint-disable @next/next/no-img-element */
'use client';
import {
  acceptFriendRequest,
  removeFriend,
  requestFriend,
} from '@/_services/friends';
import { FriendStatus, UserInfo } from '@/_types/users';
import { GENERIC_USER_IMAGE_URL } from '@/constants';
import {
  CheckIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/20/solid';
import {
  ConfirmationDialog,
  ConfirmationDialogResult,
} from '@mockingbird/stoyponents';
import { useSession } from 'next-auth/react';
import { useCallback, useState } from 'react';

type ButtonProps = {
  label: string;
  onAction: () => void;
  type: 'add' | 'accept' | 'cancel' | 'remove';
};

function FriendActionButton({ label, type, onAction }: ButtonProps) {
  return (
    <div className="tooltip" data-tip={label}>
      <button onClick={onAction} className="btn-xs btn btn-circle glass">
        {type === 'add' ? (
          <PlusIcon></PlusIcon>
        ) : type === 'cancel' ? (
          <XMarkIcon></XMarkIcon>
        ) : type === 'accept' ? (
          <CheckIcon></CheckIcon>
        ) : (
          <TrashIcon></TrashIcon>
        )}
      </button>
    </div>
  );
}

interface Props {
  friend: UserInfo;
  friendStatus: FriendStatus;
  onFriendStatusChange: (friendId: string, status: FriendStatus) => void;
}

export function FriendCard({
  friend,
  friendStatus,
  onFriendStatusChange,
}: Props) {
  const { name, image, id: friendId } = friend;
  const imageSrc = image ?? GENERIC_USER_IMAGE_URL;

  const [showRemoveFriendDialog, setShowRemoveFriendDialog] = useState(false);
  const [showCancelFriendRequestDialog, setShowCancelFriendRequestDialog] =
    useState(false);

  const { data: session } = useSession();
  const userId = session?.user?.id;

  const handleRequestFriend = useCallback(async () => {
    console.log(`Request friend: ${name}`);
    if (userId) {
      await requestFriend(userId, friendId);
      if (onFriendStatusChange) {
        onFriendStatusChange(friendId, 'requested');
      }
    }
  }, [name, userId, friendId, onFriendStatusChange]);

  const handleAcceptFriendRequest = useCallback(async () => {
    console.log(`Accept friend: ${name}`);
    if (userId) {
      await acceptFriendRequest(userId, friendId);
      if (onFriendStatusChange) {
        onFriendStatusChange(friendId, 'friend');
      }
    }
  }, [name, userId, friendId, onFriendStatusChange]);

  const handleConfirmCancelFriendRequest = useCallback(
    async (result?: ConfirmationDialogResult) => {
      if (userId) {
        if (result === 'ok') {
          console.log(`Canceling friend request: ${name}`);
          await removeFriend(userId, friendId);
          if (onFriendStatusChange) {
            onFriendStatusChange(friendId, 'none');
          }
        }
        setShowCancelFriendRequestDialog(false);
      }
    },
    [userId, name, friendId, onFriendStatusChange]
  );

  const handleConfirmRemoveFriend = useCallback(
    async (result?: ConfirmationDialogResult) => {
      if (userId) {
        if (result === 'ok') {
          console.log(`Removing friend: ${name}`);
          await removeFriend(userId, friendId);
          if (onFriendStatusChange) {
            onFriendStatusChange(friendId, 'none');
          }
        }
        setShowRemoveFriendDialog(false);
      }
    },
    [userId, name, friendId, onFriendStatusChange]
  );

  return (
    <>
      <div className="card card-side bg-base-100 shadow-xl w-[48%] p-2">
        <figure className="w-16 ml-1">
          <img
            className="rounded-full"
            src={imageSrc}
            alt="Profile Picture"
          ></img>
        </figure>
        <div className="card-body p-0 pl-1">
          <h2 className="card-title text-sm font-bold">{name}</h2>
          <p className="text-xs font-extralight">{friendId}</p>
          {/* <p className="text-xs font-extralight">
            {mutualFriends ? `${mutualFriends}` : 'No'} Mutual Friends
          </p> */}
        </div>

        <div className="card-actions justify-end mr-1 mb-1">
          <div className="flex flex-col flex-auto">
            <div className="">
              {friendStatus === 'none' ? (
                <FriendActionButton
                  label="Add Friend"
                  type="add"
                  onAction={handleRequestFriend}
                ></FriendActionButton>
              ) : friendStatus === 'friend' ? (
                <FriendActionButton
                  label="Remove Friend"
                  type="remove"
                  onAction={() => setShowRemoveFriendDialog(true)}
                ></FriendActionButton>
              ) : friendStatus === 'pending' ? (
                <FriendActionButton
                  label="Cancel Request"
                  type="cancel"
                  onAction={() => setShowCancelFriendRequestDialog(true)}
                ></FriendActionButton>
              ) : (
                <FriendActionButton
                  label="Accept Request"
                  type="accept"
                  onAction={handleAcceptFriendRequest}
                ></FriendActionButton>
              )}
            </div>
          </div>
        </div>
      </div>

      {showRemoveFriendDialog && (
        <ConfirmationDialog
          title={`Remove Friend?`}
          defaultResult={'cancel'}
          buttons={[
            { title: 'Remove', result: 'ok' },
            { title: 'Cancel', intent: 'primary', result: 'cancel' },
          ]}
          onClosed={handleConfirmRemoveFriend}
        >
          Are you sure you want to remove your friend {friend.name}?
        </ConfirmationDialog>
      )}

      {showCancelFriendRequestDialog && (
        <ConfirmationDialog
          title={`Cancel Friend Request?`}
          defaultResult={'cancel'}
          buttons={[
            { title: 'Ok', result: 'ok' },
            { title: 'Cancel', intent: 'primary', result: 'cancel' },
          ]}
          onClosed={handleConfirmCancelFriendRequest}
        >
          Are you sure you want to cancel your friend request with {friend.name}
          ?
        </ConfirmationDialog>
      )}
    </>
  );
}
