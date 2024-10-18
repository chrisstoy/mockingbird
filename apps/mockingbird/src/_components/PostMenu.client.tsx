'use client';
import { deletePost } from '@/_services/post';
import { EllipsisHorizontalIcon } from '@heroicons/react/24/solid';
import {
  ConfirmationDialog,
  ConfirmationDialogResult,
} from '@mockingbird/stoyponents';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Props = {
  postId: string;
  isComment?: boolean;
};

export function PostMenu({ postId, isComment = false }: Props) {
  const router = useRouter();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const handleDeleteComment = () => {
    console.log('delete comment');
    (document.activeElement as HTMLElement | undefined)?.blur();
    setShowConfirmDelete(true);
  };

  async function handleConfirmDelete(result?: ConfirmationDialogResult) {
    setShowConfirmDelete(false);
    if (result === 'ok') {
      const result = await deletePost(postId);
      if (result.status === 204) {
        console.log(`Deleted ${isComment ? 'comment' : 'post'}: ${postId}`);
        router.refresh();
      } else {
        console.error(
          `Failed to delete ${
            isComment ? 'comment' : 'post'
          }: ${postId}, ${JSON.stringify(result)}`
        );
      }
    }
  }

  return (
    <div className="dropdown dropdown-left">
      <div tabIndex={0} role="button" className="btn btn-circle btn-xs p-1">
        <EllipsisHorizontalIcon></EllipsisHorizontalIcon>
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content menu bg-base-100 rounded-box z-[1] p-2 shadow"
      >
        <li>
          <a onClick={handleDeleteComment}>Delete</a>
        </li>
      </ul>
      {showConfirmDelete && (
        <ConfirmationDialog
          title={`Delete ${isComment ? 'Comment' : 'Post'}?`}
          defaultResult={'cancel'}
          buttons={[
            { title: 'Ok', result: 'ok' },
            { title: 'Cancel', intent: 'primary', result: 'cancel' },
          ]}
          onClosed={handleConfirmDelete}
        >
          {`Are you sure you want to delete this ${
            isComment ? 'comment' : 'post'
          }`}
          ?
        </ConfirmationDialog>
      )}
    </div>
  );
}
