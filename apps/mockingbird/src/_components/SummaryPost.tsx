import { getCommentsForPost } from '@/_server/postsService';
import { getUserById } from '@/_server/usersService';
import { Post } from '@/_types/post';
import { auth } from '@/app/auth';
import { GENERIC_USER_IMAGE_URL } from '@/constants';
import { TextDisplay } from '@mockingbird/stoyponents';
import Link from 'next/link';
import { Suspense } from 'react';
import { CommentList } from './CommentList';
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

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <PostHeader
          name={userName}
          image={imageSrc}
          date={post.createdAt}
          postId={post.id}
          showOptionsMenu={showOptionsMenu}
        />
        <div
          className={`card bg-base-100 shadow-md ${
            linkToDetails && 'hover:bg-base-200'
          }`}
        >
          <div className="card-body">
            {linkToDetails ? (
              <Link href={`/post/${post.id}`}>
                <TextDisplay data={post.content}></TextDisplay>
              </Link>
            ) : (
              <TextDisplay data={post.content}></TextDisplay>
            )}
          </div>
          <PostActionsFooter post={post}></PostActionsFooter>
        </div>
        <div className="card-actions"></div>
        <Suspense
          fallback={
            <div className="text-secondary-content m-2 text-center">
              <ul className="list-none max-w-2xl">
                <li className="ml-2 mb-3" key="1">
                  <SkeletonComment></SkeletonComment>
                </li>
              </ul>
            </div>
          }
        >
          <CommentList
            feed={comments}
            originalPost={post}
            linkToDetails={linkToDetails}
            hideReplies={showFirstComment}
          ></CommentList>
        </Suspense>
      </div>
    </div>
  );
}
