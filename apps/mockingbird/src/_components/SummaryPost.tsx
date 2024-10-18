import { getUser } from '@/_services/users';
import { Post } from '@/_types/post';
import { auth } from '@/app/auth';
import { HandThumbDownIcon, HandThumbUpIcon } from '@heroicons/react/20/solid';
import Link from 'next/link';
import { CommentButton } from './CommentButton.client';
import { PostHeader } from './PostHeader';

type Props = {
  post: Post;
  linkToDetails?: boolean;
};

export async function SummaryPost({ post, linkToDetails = false }: Props) {
  const session = await auth();
  const poster = await getUser(post.posterId);

  const userName = poster?.name ?? 'Unknown';
  const imageSrc = poster?.image ?? '/generic-user-icon.jpg';

  const showOptionsMenu = post.posterId === session?.user?.id;

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
              <Link href={`/post/${post.id}`}>{post.content}</Link>
            ) : (
              <div>{post.content}</div>
            )}
          </div>
        </div>
        <div className="card-actions flex flex-row">
          <button className="btn btn-xs">
            <HandThumbUpIcon className="h-4 w-4" />
            Like
          </button>
          <button className="btn btn-xs">
            <HandThumbDownIcon className="h-4 w-4" />
            Dislike
          </button>
          <div className="flex-auto"></div>
          <CommentButton post={post}></CommentButton>
        </div>
      </div>
    </div>
  );
}
