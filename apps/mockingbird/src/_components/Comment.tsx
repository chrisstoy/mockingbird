import { sessionUser } from '@/_hooks/sessionUser';
import { getUserById } from '@/_server/usersService';
import { Post } from '@/_types/post';
import { GENERIC_USER_IMAGE_URL } from '@/constants';
import { TextDisplay } from '@mockingbird/stoyponents';
import Link from 'next/link';
import { CommentReplyContainer } from './CommentReplyContainer.client';
import { ImageDisplay } from './ImageDisplay.client';
import { PostHeader } from './PostHeader';

type Props = {
  comment: Post;
  originalPost: Post;
  linkToDetails?: boolean;
  hideReplies?: boolean;
};

export async function Comment({
  comment,
  originalPost,
  linkToDetails = false,
  hideReplies = false,
}: Props) {
  const user = await sessionUser();
  if (!user) {
    return null;
  }
  const poster = await getUserById(comment.posterId);

  const userName = poster?.name ?? 'Unknown';
  const imageSrc = poster?.image ?? GENERIC_USER_IMAGE_URL;
  const showOptionsMenu =
    comment.posterId === user.id || originalPost.posterId === user.id;

  const renderContent = () => (
    <>
      <PostHeader
        name={userName}
        image={imageSrc}
        date={comment.createdAt}
        postId={comment.id}
        small
        isComment
        showOptionsMenu={showOptionsMenu}
      ></PostHeader>
      <div className="text-sm bg-transparent rounded-lg my-1">
        <ImageDisplay imageId={comment.imageId}></ImageDisplay>
        <TextDisplay data={comment.content}></TextDisplay>
      </div>
    </>
  );

  return (
    <div className={`card card-compact bg-base-100 shadow-md ml-4`}>
      <div
        className={`card-body rounded-lg ${
          linkToDetails && 'hover:bg-base-200'
        }`}
      >
        {linkToDetails ? (
          <Link href={`/post/${originalPost.id}`}>{renderContent()}</Link>
        ) : (
          <div>{renderContent()}</div>
        )}
      </div>

      <CommentReplyContainer
        hideReplies={hideReplies}
        originalComment={comment}
        replyingToName={userName}
        originalPosterId={originalPost.posterId}
      ></CommentReplyContainer>
    </div>
  );
}
