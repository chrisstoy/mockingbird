import { getUser } from '@/_services/users';
import { Post } from '@/_types/post';
import { HandThumbDownIcon, HandThumbUpIcon } from '@heroicons/react/20/solid';
import Image from 'next/image';
import Link from 'next/link';
import { CommentButton } from './CommentButton.client';
import { LocalTime } from './LocalTime';

type Props = {
  post: Post;
  linkToDetails?: boolean;
};

export async function SummaryPost({ post, linkToDetails = false }: Props) {
  const poster = await getUser(post.posterId);

  const userName = poster?.name ?? 'Unknown';
  const imageSrc = poster?.image ?? '/generic-user-icon.jpg';

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex flex-row">
          <div className="avatar">
            <div className="rounded-full">
              <Image
                src={imageSrc}
                alt="Profile Picture"
                width={42}
                height={42}
              ></Image>
            </div>
          </div>
          <div className="flex flex-col ml-2 justify-center">
            <div className="mb-1">{userName}</div>
            <div className="text-xs">
              Posted on <LocalTime date={post.createdAt}></LocalTime>
            </div>
          </div>
        </div>
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
