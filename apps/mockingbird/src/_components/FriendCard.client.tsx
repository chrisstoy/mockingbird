'use client';
import { ComponentPropsWithoutRef } from 'react';
import {
  CheckIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/20/solid';
import { UserInfo } from '@/_types/users';

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
}

export function FriendCard({ friend }: Props) {
  const { name, image, mutualFriends, friendStatus } = friend;
  const imageSrc = image ?? '/generic-user-icon.jpg';

  const handleAddFriend = () => {
    console.log(`Add friend: ${name}`);
  };

  const handleAcceptFriend = () => {
    console.log(`Accept friend: ${name}`);
  };

  const handleRemoveFriend = () => {
    console.log(`Removing friend: ${name}`);
  };

  const handleCancelFriendRequest = () => {
    console.log(`Cancel friend request: ${name}`);
  };

  return (
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
        <p className="text-xs font-extralight">
          {mutualFriends ? `${mutualFriends}` : 'No'} Mutual Friends
        </p>
      </div>

      <div className="card-actions justify-end mr-1 mb-1">
        <div className="flex flex-col flex-auto">
          <div className="">
            {friendStatus === undefined ? (
              <FriendActionButton
                label="Add Friend"
                type="add"
                onAction={handleAddFriend}
              ></FriendActionButton>
            ) : friendStatus === 'accepted' ? (
              <FriendActionButton
                label="Remove Friend"
                type="remove"
                onAction={handleRemoveFriend}
              ></FriendActionButton>
            ) : friendStatus === 'pending' ? (
              <FriendActionButton
                label="Cancel Request"
                type="cancel"
                onAction={handleCancelFriendRequest}
              ></FriendActionButton>
            ) : (
              <FriendActionButton
                label="Accept Request"
                type="accept"
                onAction={handleCancelFriendRequest}
              ></FriendActionButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
