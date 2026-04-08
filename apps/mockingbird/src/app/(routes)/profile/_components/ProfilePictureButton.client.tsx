'use client';

import { CameraIcon } from '@heroicons/react/24/solid';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { ChangeProfilePictureDialog } from './ChangeProfilePictureDialog.client';

interface Props {
  currentImageSrc: string;
}

export function ProfilePictureButton({ currentImageSrc }: Props) {
  const { update: updateSession } = useSession();
  const [imageSrc, setImageSrc] = useState(currentImageSrc);
  const [showDialog, setShowDialog] = useState(false);

  const handleClosed = async (newImageUrl?: string) => {
    setShowDialog(false);
    if (newImageUrl) {
      setImageSrc(newImageUrl);
      await updateSession({ image: newImageUrl });
    }
  };

  return (
    <>
      <div className="relative w-24 h-24 group">
        <img
          src={imageSrc}
          alt="Profile Picture"
          width={96}
          height={96}
          className="w-24 h-24 rounded-xl object-cover"
        />
        {/* Camera icon overlay button */}
        <button
          type="button"
          aria-label="Change profile picture"
          onClick={() => setShowDialog(true)}
          className="absolute bottom-1 right-1 bg-base-100 border border-base-300 rounded-full p-1.5 shadow-md transition-all opacity-80 hover:opacity-100 hover:scale-110 hover:bg-primary hover:text-primary-content hover:border-primary"
        >
          <CameraIcon className="w-4 h-4" />
        </button>
      </div>

      {showDialog && (
        <ChangeProfilePictureDialog
          currentImageSrc={imageSrc}
          onClosed={handleClosed}
        />
      )}
    </>
  );
}
