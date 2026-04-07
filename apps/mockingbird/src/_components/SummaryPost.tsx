import {
  getCommentsForPost,
  getNumberOfCommentsForPost,
} from '@/_server/postsService';
import { getUserById } from '@/_server/usersService';
import { Post } from '@/_types';
import { auth } from '@/app/auth';
import { GENERIC_USER_IMAGE_URL } from '@/constants';
import { TextDisplay } from '@mockingbird/stoyponents';
import Link from 'next/link';
import { Suspense } from 'react';
import { CommentList } from './CommentList';
import { ImageDisplay } from './ImageDisplay.client';
import { PostActionsFooter } from './PostActionsFooter';
import { PostHeader } from './PostHeader';
import { SkeletonComment } from './SkeletonComment';

type Props = {
  post: Post;
  linkToDetails?: boolean;
  showFirstComment?: boolean;
};

export async function SummaryPost({
  post,
  linkToDetails = false,
  showFirstComment = false,
}: Props) {
  const session = await auth();
  const poster = await getUserById(post.posterId);

  const userName = poster?.name ?? 'Unknown';
  const imageSrc = poster?.image ?? GENERIC_USER_IMAGE_URL;

  const showOptionsMenu = post.posterId === session?.user?.id;

  const comments =
    (await getCommentsForPost(post.id, showFirstComment ? 1 : undefined)) ?? [];

  const numberOfComments = await getNumberOfCommentsForPost(post.id);

  return (
    <div className="bg-white rounded-2xl border border-base-200 shadow-sm overflow-hidden">
      <div className="px-4 pt-4 pb-2">
        <PostHeader
          name={userName}
          image={imageSrc}
          date={post.createdAt}
          postId={post.id}
          showOptionsMenu={showOptionsMenu}
          audience={post.audience}
        />
      </div>

      {linkToDetails ? (
        <Link href={`/post/${post.id}`} className="block hover:bg-base-50 transition-colors">
          <div className="px-4 pb-3">
            <ImageDisplay imageId={post.imageId} />
            <TextDisplay data={post.content} />
          </div>
        </Link>
      ) : (
        <div className="px-4 pb-3">
          <ImageDisplay imageId={post.imageId} />
          <TextDisplay data={post.content} />
        </div>
      )}

      <PostActionsFooter post={post} numberOfComments={numberOfComments} />

      <Suspense
        fallback={
          <div className="px-4 pb-3">
            <SkeletonComment />
          </div>
        }
      >
        <CommentList
          feed={comments}
          originalPost={post}
          linkToDetails={linkToDetails}
          hideReplies={showFirstComment}
        />
      </Suspense>
    </div>
  );
}
