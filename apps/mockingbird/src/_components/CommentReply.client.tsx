'use cient';
import { getUser } from '@/_services/users';
import { Post } from '@/_types/post';
import { TextDisplay } from '@mockingbird/stoyponents';
import { useSession } from 'next-auth/react';
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
  const { data: session } = useSession();
  const [commenterNameAndImage, setCommenterNameAndImage] = useState({
    name: 'Unknown',
    image: '/generic-user-icon.jpg',
  });

  useEffect(() => {
    (async () => {
      const poster = await getUser(comment.posterId);
      setCommenterNameAndImage({
        name: poster?.name ?? 'Unknown',
        image: poster?.image ?? '/generic-user-icon.jpg',
      });
    })();
  }, [comment.posterId]);

  const showOptionsMenu = useMemo(() => {
    return (
      comment.posterId === session?.user?.id ||
      originalPosterId === session?.user?.id
    );
  }, [session?.user?.id, originalPosterId, comment.posterId]);

  return (
    <div
      data-id={comment.id}
      className={`border-solid border border-base-500 card card-compact bg-base-100`}
    >
      <div className={`card-body rounded-lg p-0`}>
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
