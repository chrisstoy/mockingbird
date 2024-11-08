import { getUser } from '@/_services/users';
import { Post } from '@/_types/post';
import { auth } from '@/app/auth';
import { TextDisplay } from '@mockingbird/stoyponents';
import Link from 'next/link';
import { CommentReplyContainer } from './CommentReplyContainer.client';
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
  const session = await auth();
  const poster = await getUser(comment.posterId);

  const userName = poster?.name ?? 'Unknown';
  const imageSrc = poster?.image ?? '/generic-user-icon.jpg';
  const showOptionsMenu =
    comment.posterId === session?.user?.id ||
    originalPost.posterId === session?.user?.id;

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
      <div className="text-sm bg-transparent rounded-lg">
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
        originalPosterId={originalPost.posterId}
      ></CommentReplyContainer>
    </div>
  );
}
