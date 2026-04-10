'use client';
import {
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  requestFriend,
} from '@/_apiServices/friends';
import { useSessionUser } from '@/_hooks/useSessionUser';
import { FriendStatus, SimpleUserInfo, UserId } from '@/_types';
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
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

interface Props {
  friend: SimpleUserInfo;
  friendStatus: FriendStatus;
  onFriendStatusChange: (friendId: UserId, status: FriendStatus) => void;
}

function nameToHandle(name: string) {
  return '@' + name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function FriendCard({ friend, friendStatus, onFriendStatusChange }: Props) {
  const { name, image, id: friendId } = friend;
  const imageSrc = image ?? GENERIC_USER_IMAGE_URL;

  const [showRemoveFriendDialog, setShowRemoveFriendDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const user = useSessionUser();
  const userId = user?.id;
  const router = useRouter();

  const handleRequestFriend = useCallback(async () => {
    if (!userId) return;
    await requestFriend(userId, friendId);
    onFriendStatusChange(friendId, 'requested');
  }, [userId, friendId, onFriendStatusChange]);

  const handleAcceptFriendRequest = useCallback(async () => {
    if (!userId) return;
    await acceptFriendRequest(userId, friendId);
    onFriendStatusChange(friendId, 'friend');
    router.refresh();
  }, [userId, friendId, onFriendStatusChange, router]);

  const handleRejectFriendRequest = useCallback(async () => {
    if (!userId) return;
    await rejectFriendRequest(userId, friendId);
    onFriendStatusChange(friendId, 'none');
    router.refresh();
  }, [userId, friendId, onFriendStatusChange, router]);

  const handleConfirmCancel = useCallback(async (result?: ConfirmationDialogResult) => {
    setShowCancelDialog(false);
    if (result === 'ok' && userId) {
      await removeFriend(userId, friendId);
      onFriendStatusChange(friendId, 'none');
    }
  }, [userId, friendId, onFriendStatusChange]);

  const handleConfirmRemove = useCallback(async (result?: ConfirmationDialogResult) => {
    setShowRemoveFriendDialog(false);
    if (result === 'ok' && userId) {
      await removeFriend(userId, friendId);
      onFriendStatusChange(friendId, 'none');
    }
  }, [userId, friendId, onFriendStatusChange]);

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-3 bg-base-100 rounded-2xl border border-base-200 hover:border-base-300 transition-colors">
        {/* Avatar */}
        <img
          src={imageSrc}
          alt={name}
          className="w-10 h-10 rounded-full object-cover shrink-0"
        />

        {/* Name + handle */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-base-content leading-none truncate">
            {name}
          </p>
          <p className="text-xs text-base-content/40 leading-none mt-0.5 truncate">
            {nameToHandle(name)}
          </p>
        </div>

        {/* Action */}
        <div className="shrink-0">
          {friendStatus === 'none' && (
            <button
              onClick={handleRequestFriend}
              title="Add Friend"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-colors"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              Add
            </button>
          )}
          {friendStatus === 'friend' && (
            <button
              onClick={() => setShowRemoveFriendDialog(true)}
              title="Remove Friend"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-base-200 hover:bg-error/10 text-base-content/50 hover:text-error text-xs font-semibold transition-colors"
            >
              <TrashIcon className="w-3.5 h-3.5" />
              Remove
            </button>
          )}
          {friendStatus === 'pending' && (
            <button
              onClick={() => setShowCancelDialog(true)}
              title="Cancel Request"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-base-200 hover:bg-error/10 text-base-content/40 hover:text-error text-xs font-semibold transition-colors"
            >
              <XMarkIcon className="w-3.5 h-3.5" />
              Pending
            </button>
          )}
          {friendStatus === 'requested' && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleAcceptFriendRequest}
                title="Accept Request"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-success/10 hover:bg-success/20 text-success text-xs font-semibold transition-colors"
              >
                <CheckIcon className="w-3.5 h-3.5" />
                Accept
              </button>
              <button
                onClick={handleRejectFriendRequest}
                title="Reject Request"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-error/10 hover:bg-error/20 text-error text-xs font-semibold transition-colors"
              >
                <XMarkIcon className="w-3.5 h-3.5" />
                Reject
              </button>
            </div>
          )}
        </div>
      </div>

      {showRemoveFriendDialog && (
        <ConfirmationDialog
          title="Remove Friend?"
          defaultResult="cancel"
          buttons={[
            { title: 'Remove', result: 'ok', intent: 'error' },
            { title: 'Cancel', intent: 'primary', result: 'cancel' },
          ]}
          onClosed={handleConfirmRemove}
        >
          Are you sure you want to remove {name} from your friends?
        </ConfirmationDialog>
      )}

      {showCancelDialog && (
        <ConfirmationDialog
          title="Cancel Friend Request?"
          defaultResult="cancel"
          buttons={[
            { title: 'Cancel Request', result: 'ok' },
            { title: 'Keep', intent: 'primary', result: 'cancel' },
          ]}
          onClosed={handleConfirmCancel}
        >
          Cancel your friend request to {name}?
        </ConfirmationDialog>
      )}
    </>
  );
}
