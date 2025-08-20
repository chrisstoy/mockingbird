'use cient';
import { getUser } from '@/_apiServices/users';
import { useSessionUser } from '@/_hooks/useSessionUser';
import { Post } from '@/_types';
import { GENERIC_USER_IMAGE_URL } from '@/constants';
import { TextDisplay } from '@mockingbird/stoyponents';
import { useEffect, useMemo, useState } from 'react';
import { PostHeader } from './PostHeader';
import { ReplyFooter } from './ReplyFooter.client';

type Props = {
  comment: Post;
  originalPosterId: string;
  showOptionsMenu?: boolean;
  onReplyToComment: () => void;
};

export function CommentReply({
  comment,
  originalPosterId,
  onReplyToComment,
}: Props) {
  const user = useSessionUser();
  const [commenterNameAndImage, setCommenterNameAndImage] = useState({
    name: 'Unknown',
    image: GENERIC_USER_IMAGE_URL,
  });

  useEffect(() => {
    (async () => {
      const poster = await getUser(comment.posterId);
      setCommenterNameAndImage({
        name: poster?.name ?? 'Unknown',
        image: poster?.image ?? GENERIC_USER_IMAGE_URL,
      });
    })();
  }, [comment.posterId]);

  const showOptionsMenu = useMemo(() => {
    return comment.posterId === user?.id || originalPosterId === user?.id;
  }, [user?.id, originalPosterId, comment.posterId]);

  return (
    <div
      data-id={comment.id}
      className={`card-bordered card card-compact bg-base-100`}
    >
      <div className={`card-body rounded-lg`}>
        <PostHeader
          name={commenterNameAndImage.name}
          image={commenterNameAndImage.image}
          date={comment.createdAt}
          postId={comment.id}
          small
          isComment
          showOptionsMenu={showOptionsMenu}
        ></PostHeader>
        <div className="text-sm bg-transparent rounded-lg bg-base-200">
          <TextDisplay data={comment.content}></TextDisplay>
        </div>
        <ReplyFooter onReplyToComment={onReplyToComment}></ReplyFooter>
      </div>
    </div>
  );
}
