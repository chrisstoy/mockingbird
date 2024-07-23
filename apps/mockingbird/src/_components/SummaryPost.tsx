import { Post } from '@/_services/post';
import { auth } from '@/auth';
import {
  ChatBubbleLeftEllipsisIcon,
  HandThumbDownIcon,
  HandThumbUpIcon,
} from '@heroicons/react/20/solid';
import Image from 'next/image';

type Props = {
  post: Post;
};

export async function SummaryPost({ post }: Props) {
  const session = await auth();

  const userName = session?.user?.name ?? 'Guy McFearson';
  const imageSrc = session?.user?.image ?? '/generic-user-icon.jpg';

  return (
    <div className="card bg-base-100 w-96 shadow-xl">
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
              Posted on {post.createdAt.toLocaleString()}
            </div>
          </div>
        </div>
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">{post.content}</div>
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
          <button className="btn btn-xs">
            <ChatBubbleLeftEllipsisIcon className="h-4 w-4" />
            Comment
          </button>
        </div>
      </div>
    </div>
  );
}
